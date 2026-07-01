import { useCallback } from "react"
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
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={item.productName ?? ""}
                    onChange={(e) =>
                      updateRow(index, "productName", e.target.value)
                    }
                    placeholder="Nombre del producto"
                    disabled={disabled}
                    className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
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
