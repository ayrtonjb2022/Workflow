import { useCallback, useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../../lib/api.js"
import { Button } from "../../../components/ui/Button.js"

export interface LineItem {
  productId: string
  productName?: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface LineItemEditorProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  disabled?: boolean
}

export default function LineItemEditor({
  items,
  onChange,
  disabled = false,
}: LineItemEditorProps) {
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({})
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const searchRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (openIndex !== null) {
        const el = searchRefs.current[openIndex]
        if (el && !el.contains(e.target as Node)) {
          setOpenIndex(null)
        }
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [openIndex])

  const addRow = useCallback(() => {
    onChange([
      ...items,
      { productId: "", productName: "", quantity: 1, unitPrice: 0, subtotal: 0 },
    ])
  }, [items, onChange])

  const removeRow = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index))
    },
    [items, onChange],
  )

  const updateRow = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      const updated = items.map((item, i) => {
        if (i !== index) return item

        const next = { ...item, [field]: value }

        if (field === "quantity" || field === "unitPrice") {
          const qty = field === "quantity" ? Number(value) : item.quantity
          const price = field === "unitPrice" ? Number(value) : item.unitPrice
          next.subtotal = qty * price
        }

        return next
      })
      onChange(updated)
    },
    [items, onChange],
  )

  const selectProduct = useCallback(
    (index: number, product: { id: string; name: string; unitPrice: number }) => {
      const updated = items.map((item, i) => {
        if (i !== index) return item
        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity || 1,
          unitPrice: Number(product.unitPrice),
          subtotal: (item.quantity || 1) * Number(product.unitPrice),
        }
      })
      onChange(updated)
      setOpenIndex(null)
      setSearchTerms((prev) => ({ ...prev, [index]: product.name }))
    },
    [items, onChange],
  )

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                P. Unitario
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Subtotal
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-2 relative">
                  <div ref={(el) => { searchRefs.current[index] = el }}>
                    <input
                      type="text"
                      value={item.productId ? (item.productName ?? "") : (searchTerms[index] ?? "")}
                      onChange={(e) => {
                        const val = e.target.value
                        setSearchTerms((prev) => ({ ...prev, [index]: val }))
                        setOpenIndex(index)
                        if (!val) {
                          updateRow(index, "productId", "")
                          updateRow(index, "productName", "")
                        }
                      }}
                      onFocus={() => {
                        if (!item.productId) setOpenIndex(index)
                      }}
                      placeholder="Buscar producto..."
                      disabled={disabled}
                      className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    {item.productId && !disabled && (
                      <button
                        type="button"
                        onClick={() => {
                          updateRow(index, "productId", "")
                          updateRow(index, "productName", "")
                          setSearchTerms((prev) => ({ ...prev, [index]: "" }))
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                    {!disabled && openIndex === index && (
                      <ProductSearchDropdown
                        search={searchTerms[index] ?? ""}
                        onSelect={(p) => selectProduct(index, p)}
                        inputRef={searchRefs.current[index]}
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateRow(index, "quantity", e.target.value)
                    }
                    disabled={disabled}
                    className="block w-20 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateRow(index, "unitPrice", e.target.value)
                    }
                    disabled={disabled}
                    className="block w-24 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </td>
                <td className="px-4 py-2">
                  <span className="text-sm text-gray-900 font-medium">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  {!disabled && items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                    >
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <Button variant="secondary" size="sm" onClick={addRow}>
          Agregar fila
        </Button>
      )}
    </div>
  )
}

// ── Product search dropdown ─────────────────────────────────
interface ProductResult {
  id: string
  name: string
  code: string
  unitPrice: number
  stock: number
}

interface PaginatedProducts {
  data: ProductResult[]
}

function ProductSearchDropdown({
  search,
  onSelect,
  inputRef,
}: {
  search: string
  onSelect: (p: ProductResult) => void
  inputRef: HTMLDivElement | null
}) {
  const [dropdownStyle, setDropdownStyle] = useState<Record<string, string>>({})
  const { data, isLoading } = useQuery({
    queryKey: ["products", "search", search],
    queryFn: () =>
      api<PaginatedProducts>(`/products?search=${encodeURIComponent(search)}&limit=8`),
    enabled: search.length >= 1,
  })

  // Calculate position relative to viewport (portal bypasses overflow clipping)
  useEffect(() => {
    if (!inputRef) return
    const rect = inputRef.getBoundingClientRect()
    setDropdownStyle({
      position: "fixed",
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    })
  }, [inputRef])

  if (!search || search.length < 1) return null

  const products = data?.data ?? []

  const dropdown = (
    <div
      style={dropdownStyle}
      onMouseDown={(e) => e.stopPropagation()}
      className="z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
    >
      {isLoading && (
        <div className="px-3 py-2 text-sm text-gray-500 text-center">
          Buscando...
        </div>
      )}
      {!isLoading && products.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-500 text-center">
          Sin resultados
        </div>
      )}
      {products.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p)}
          className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
        >
          <div className="font-medium text-gray-900">{p.name}</div>
          <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
            <span>Código: {p.code}</span>
            <span>$ {Number(p.unitPrice).toFixed(2)}</span>
            <span>Stock: {p.stock}</span>
          </div>
        </button>
      ))}
    </div>
  )

  return createPortal(dropdown, document.body)
}
