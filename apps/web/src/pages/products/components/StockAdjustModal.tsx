import { useState } from "react"
import { api } from "../../../lib/api.js"
import { Modal } from "../../../components/ui/Modal.js"
import { Input } from "../../../components/ui/Input.js"
import { Button } from "../../../components/ui/Button.js"

interface StockAdjustModalProps {
  open: boolean
  onClose: () => void
  productId: string
  productName: string
  onSuccess: () => void
}

export default function StockAdjustModal({
  open,
  onClose,
  productId,
  productName,
  onSuccess,
}: StockAdjustModalProps) {
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (quantity === 0) {
      setError("La cantidad debe ser distinta de cero")
      setLoading(false)
      return
    }

    try {
      await api(`/products/${productId}/adjust-stock`, {
        method: "POST",
        body: JSON.stringify({ quantity, reason: reason || null }),
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al ajustar el stock",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajustar Stock">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Producto: <span className="font-medium text-gray-900">{productName}</span>
        </p>

        <Input
          label="Cantidad"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          placeholder="Positivo aumenta, negativo disminuye"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Motivo (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ej: Ajuste de inventario, dañado, etc."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Ajustar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
