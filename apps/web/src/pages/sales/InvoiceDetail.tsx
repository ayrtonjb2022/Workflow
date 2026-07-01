import { useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import StatusBadge from "./components/StatusBadge.js"
import AddPaymentModal from "./AddPaymentModal.js"
import type { Invoice } from "../../types/sales.js"

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  check: "Cheque",
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showPayment, setShowPayment] = useState(false)

  const { data: invoice, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => api<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  })

  const sendMutation = useMutation({
    mutationFn: () => api(`/invoices/${id}/send`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", id] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => api(`/invoices/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", id] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error al cargar la factura</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Reintentar
        </Button>
        <Button
          variant="ghost"
          className="ml-2"
          onClick={() => navigate("/sales/invoices")}
        >
          Volver a facturas
        </Button>
      </div>
    )
  }

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )
  const taxRate = 0.21
  const tax = subtotal * taxRate
  const total = subtotal + tax
  const paidAmount = invoice.paidAmount ?? 0
  const remaining = total - paidAmount

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/sales/invoices")}
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            &larr; Volver a facturas
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Factura {invoice.number}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Información</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="text-sm font-medium text-gray-900">
              {invoice.customer.name}
            </p>
            {invoice.customer.email && (
              <p className="text-sm text-gray-500">{invoice.customer.email}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(invoice.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        {invoice.notes && (
          <div>
            <p className="text-sm text-gray-500">Notas</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                P. Unitario
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {item.product?.name ?? item.productId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  ${item.unitPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                  ${item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
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
            <span className="text-gray-900 font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-base font-semibold text-gray-900">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payments section */}
      {invoice.status !== "CANCELLED" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pagos</h2>
            <Button onClick={() => setShowPayment(true)}>
              Registrar Pago
            </Button>
          </div>

          {invoice.payments.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {methodLabels[payment.method] ?? payment.method}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {payment.reference ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              No hay pagos registrados
            </p>
          )}

          {/* Paid summary */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-sm text-gray-600">Total pagado</span>
            <span
              className={`text-sm font-semibold ${
                paidAmount >= total ? "text-green-600" : "text-gray-900"
              }`}
            >
              ${paidAmount.toFixed(2)} / ${total.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      <AddPaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        invoiceId={invoice.id}
        remainingAmount={remaining > 0 ? remaining : 0}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["invoices", id] })
        }}
      />

      {/* Action buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {invoice.status === "DRAFT" && (
          <div className="flex items-center justify-end gap-3">
            <Button
              loading={sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              Enviar
            </Button>
          </div>
        )}

        {invoice.status === "SENT" && (
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Cancelar
            </Button>
          </div>
        )}

        {invoice.status === "PAID" && (
          <div className="flex items-center justify-end">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-sm text-green-800 font-medium">✓ Pagada</p>
            </div>
          </div>
        )}

        {invoice.status === "CANCELLED" && (
          <div className="flex items-center justify-end">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-800 font-medium">
                ✗ Factura cancelada
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
