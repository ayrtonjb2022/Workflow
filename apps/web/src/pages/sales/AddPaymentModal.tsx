import { useState } from "react"
import { api } from "../../lib/api.js"
import { Modal } from "../../components/ui/Modal.js"
import { Input } from "../../components/ui/Input.js"
import { Button } from "../../components/ui/Button.js"

interface AddPaymentModalProps {
  open: boolean
  onClose: () => void
  invoiceId: string
  remainingAmount: number
  onSuccess: () => void
}

export default function AddPaymentModal({
  open,
  onClose,
  invoiceId,
  remainingAmount,
  onSuccess,
}: AddPaymentModalProps) {
  const [method, setMethod] = useState("cash")
  const [amount, setAmount] = useState(remainingAmount)
  const [reference, setReference] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api(`/invoices/${invoiceId}/payments`, {
        method: "POST",
        body: JSON.stringify({ method, amount, reference: reference || null }),
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar el pago",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar Pago">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Método de pago
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="card">Tarjeta</option>
            <option value="check">Cheque</option>
          </select>
        </div>

        <Input
          label="Monto"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />

        <Input
          label="Referencia"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Número de referencia (opcional)"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
