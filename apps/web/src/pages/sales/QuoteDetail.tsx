import { useParams, useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import StatusBadge from "./components/StatusBadge.js"
import type { Quote } from "../../types/sales.js"

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: quote, isLoading, isError, refetch } = useQuery({
    queryKey: ["quotes", id],
    queryFn: () => api<Quote>(`/quotes/${id}`),
    enabled: !!id,
  })

  const sendMutation = useMutation({
    mutationFn: () => api(`/quotes/${id}/send`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", id] })
    },
  })

  const acceptMutation = useMutation({
    mutationFn: () => api(`/quotes/${id}/accept`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", id] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => api(`/quotes/${id}/reject`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", id] })
    },
  })

  const convertMutation = useMutation({
    mutationFn: () => api(`/quotes/${id}/convert`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", id] })
      navigate("/sales/orders")
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !quote) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error al cargar la cotización</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Reintentar
        </Button>
        <Button
          variant="ghost"
          className="ml-2"
          onClick={() => navigate("/sales/quotes")}
        >
          Volver a cotizaciones
        </Button>
      </div>
    )
  }

  const subtotal = quote.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )
  const taxRate = 0.21
  const tax = subtotal * taxRate
  const total = subtotal + tax

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/sales/quotes")}
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            &larr; Volver a cotizaciones
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Cotización {quote.number}
            </h1>
            <StatusBadge status={quote.status} />
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
              {quote.customer.name}
            </p>
            {quote.customer.email && (
              <p className="text-sm text-gray-500">{quote.customer.email}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(quote.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        {quote.notes && (
          <div>
            <p className="text-sm text-gray-500">Notas</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {quote.notes}
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
            {quote.items.map((item) => (
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

      {/* Action buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-end mb-4">
          <a
            href={`/api/quotes/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Descargar PDF
          </a>
        </div>

        {quote.status === "DRAFT" && (
          <div className="flex items-center justify-end gap-3">
            <Button
              loading={sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              Enviar
            </Button>
          </div>
        )}

        {quote.status === "SENT" && (
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="danger"
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              Rechazar
            </Button>
            <Button
              variant="primary"
              loading={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate()}
            >
              Aceptar
            </Button>
          </div>
        )}

        {quote.status === "ACCEPTED" && (
          <div className="flex items-center justify-end gap-3">
            <Button
              loading={convertMutation.isPending}
              onClick={() => convertMutation.mutate()}
            >
              Convertir a Pedido
            </Button>
          </div>
        )}

        {quote.status === "REJECTED" && (
          <div className="flex items-center justify-end">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-800 font-medium">
                ✗ Rechazada por el cliente
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
