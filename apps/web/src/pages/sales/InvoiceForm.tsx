import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Input } from "../../components/ui/Input.js"
import LineItemEditor, {
  type LineItem,
} from "./components/LineItemEditor.js"
import type { Invoice, PaginatedResponse } from "../../types/sales.js"
import type { CustomerSummary } from "../../types/sales.js"

const TAX_RATE = 0.21

export default function InvoiceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [customerId, setCustomerId] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [items, setItems] = useState<LineItem[]>([
    { productId: "", productName: "", quantity: 1, unitPrice: 0, subtotal: 0 },
  ])
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: customers } = useQuery({
    queryKey: ["customers", { search: customerSearch }],
    queryFn: () =>
      api<PaginatedResponse<CustomerSummary>>(
        `/customers?search=${encodeURIComponent(customerSearch)}&limit=10`,
      ),
  })

  // Load existing invoice when editing
  const { data: invoiceData, isLoading: loadingInvoice } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => api<Invoice>(`/invoices/${id}`),
    enabled: isEditing,
  })

  // Populate form when invoice data loads
  useEffect(() => {
    if (!invoiceData) return
    setCustomerId(invoiceData.customerId)
    setCustomerName(invoiceData.customer?.name ?? "")
    setNotes(invoiceData.notes ?? "")
    setItems(
      invoiceData.items.map((item) => ({
        productId: item.productId,
        productName: item.product?.name ?? "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    )
  }, [invoiceData])

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const validate = (): boolean => {
    const next: Record<string, string> = {}

    if (!customerId) {
      next.customer = "Cliente requerido"
    }

    if (items.length === 0 || items.every((i) => !i.productName)) {
      next.items = "Al menos un producto"
    }

    const missingProductId = items.some(
      (i) => i.productName && !i.productId,
    )
    if (missingProductId) {
      next.items = "Seleccioná un producto existente de la lista"
    }

    const invalidItem = items.some(
      (i) => i.productName && (i.quantity <= 0 || i.unitPrice < 0),
    )
    if (invalidItem) {
      next.itemDetail = "Verificar cantidades y precios"
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const mutation = useMutation({
    mutationFn: (data: {
      customerId: string
      date: string
      status: string
      notes: string | null
      tax: number
      items: Array<{
        productId?: string
        productName?: string
        quantity: number
        unitPrice: number
      }>
    }) =>
      isEditing
        ? api(`/invoices/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          })
        : api("/invoices", {
            method: "POST",
            body: JSON.stringify(data),
          }),
    onSuccess: () => navigate("/sales/invoices"),
  })

  const handleSave = (status: "DRAFT" | "SENT") => {
    if (!validate()) return

    const lineItems = items
      .filter((i) => i.productName)
      .map((i) => ({
        productId: i.productId || undefined,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }))

    mutation.mutate({
      customerId,
      date: new Date().toISOString().slice(0, 10),
      status,
      notes: notes || null,
      tax,
      items: lineItems,
    })
  }

  const handleSelectCustomer = (c: CustomerSummary) => {
    setCustomerId(c.id)
    setCustomerName(c.name)
    setCustomerSearch("")
    setErrors((prev) => {
      const next = { ...prev }
      delete next.customer
      return next
    })
  }

  if (isEditing && loadingInvoice) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/sales/invoices")}
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            &larr; Volver a facturas
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Editar Factura" : "Nueva Factura"}
          </h1>
        </div>
      </div>

      {/* Customer selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Cliente</h2>

        {customerName && customerId
          ? (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {customerName}
                </p>
                <p className="text-xs text-gray-500">ID: {customerId}</p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerId("")
                    setCustomerName("")
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Cambiar
                </button>
              )}
            </div>
          )
          : (
            <div className="space-y-2">
              <Input
                placeholder="Buscar cliente por nombre..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                disabled={isEditing}
              />
              {customers && customers.data.length > 0 && customerSearch && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-48 overflow-y-auto">
                  {customers.data.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">
                        {c.name}
                      </span>
                      {c.email && (
                        <span className="text-gray-500 ml-2">{c.email}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {errors.customer && (
                <p className="text-sm text-red-600">{errors.customer}</p>
              )}
            </div>
          )}
      </div>

      {/* Line items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
        <LineItemEditor
          items={items}
          onChange={setItems}
          disabled={isEditing}
        />
        {errors.items && (
          <p className="text-sm text-red-600">{errors.items}</p>
        )}
        {errors.itemDetail && (
          <p className="text-sm text-red-600">{errors.itemDetail}</p>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          disabled={isEditing}
          placeholder="Notas opcionales..."
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 resize-none"
        />
      </div>

      {/* Totals footer */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-2 max-w-xs ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900 font-medium">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IVA (21%)</span>
            <span className="text-gray-900 font-medium">
              ${tax.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-base font-semibold text-gray-900">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!isEditing && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate("/sales/invoices")}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            loading={mutation.isPending}
            onClick={() => handleSave("DRAFT")}
          >
            Guardar Borrador
          </Button>
          <Button
            variant="primary"
            loading={mutation.isPending}
            onClick={() => handleSave("SENT")}
          >
            Guardar y Enviar
          </Button>
        </div>
      )}
    </div>
  )
}
