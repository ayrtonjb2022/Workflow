import { useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Modal } from "../../components/ui/Modal.js"
import { Input } from "../../components/ui/Input.js"
import type { CashRegister, CashMovement } from "../../types/cash-register.js"

export default function CashRegisterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showIn, setShowIn] = useState(false)
  const [showOut, setShowOut] = useState(false)
  const [inAmount, setInAmount] = useState(0)
  const [inDescription, setInDescription] = useState("")
  const [inReference, setInReference] = useState("")
  const [outAmount, setOutAmount] = useState(0)
  const [outDescription, setOutDescription] = useState("")
  const [outReference, setOutReference] = useState("")
  const [error, setError] = useState("")
  const [mutLoading, setMutLoading] = useState(false)

  const { data: register, isLoading, isError, refetch } = useQuery({
    queryKey: ["cash-registers", id],
    queryFn: () => api<CashRegister>(`/cash-registers/${id}`),
    enabled: !!id,
  })

  const addMovement = async (
    type: "IN" | "OUT",
    amount: number,
    description?: string,
    reference?: string,
  ) => {
    setMutLoading(true)
    setError("")
    try {
      await api(`/cash-registers/${id}/movements`, {
        method: "POST",
        body: JSON.stringify({ type, amount, description: description || null, reference: reference || null }),
      })
      queryClient.invalidateQueries({ queryKey: ["cash-registers", id] })
      setShowIn(false)
      setShowOut(false)
      setInAmount(0)
      setInDescription("")
      setInReference("")
      setOutAmount(0)
      setOutDescription("")
      setOutReference("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar movimiento")
    } finally {
      setMutLoading(false)
    }
  }

  const isOpen = register?.openedAt && !register?.closedAt

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !register) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error al cargar la caja</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Reintentar
        </Button>
        <Button
          variant="ghost"
          className="ml-2"
          onClick={() => navigate("/cash/registers")}
        >
          Volver a cajas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/cash/registers")}
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            &larr; Volver a cajas
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {register.name}
            </h1>
            {isOpen
              ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Abierta
                </span>
              )
              : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Cerrada
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Información</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Sucursal</p>
            <p className="text-sm font-medium text-gray-900">
              {register.branch?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Saldo actual</p>
            <p className="text-xl font-bold text-gray-900">
              ${register.balance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Creada</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(register.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {register.openedAt && (
            <div>
              <p className="text-sm text-gray-500">Abierta desde</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(register.openedAt).toLocaleString()}
              </p>
            </div>
          )}
          {register.closedAt && (
            <div>
              <p className="text-sm text-gray-500">Cerrada</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(register.closedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {isOpen && (
        <div className="flex items-center gap-3">
          <Button onClick={() => { setShowIn(true); setError("") }}>
            Registrar Ingreso
          </Button>
          <Button variant="secondary" onClick={() => { setShowOut(true); setError("") }}>
            Registrar Egreso
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Movements table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Movimientos</h2>
        </div>
        {register.cashMovements && register.cashMovements.length > 0
          ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Referencia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {register.cashMovements.map((movement: CashMovement) => (
                  <tr key={movement.id}>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(movement.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movement.type === "IN"
                        ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ingreso
                          </span>
                        )
                        : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Egreso
                          </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium whitespace-nowrap">
                      <span className={movement.type === "IN" ? "text-green-600" : "text-red-600"}>
                        {movement.type === "IN" ? "+" : "-"}$
                        {movement.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {movement.description ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {movement.reference ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
          : (
            <p className="text-sm text-gray-500 py-12 text-center">
              No hay movimientos registrados
            </p>
          )}
      </div>

      {/* Ingreso Modal */}
      <Modal
        open={showIn}
        onClose={() => { setShowIn(false); setInAmount(0); setInDescription(""); setInReference(""); setError("") }}
        title="Registrar Ingreso"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addMovement("IN", inAmount, inDescription, inReference)
          }}
          className="space-y-4"
        >
          <Input
            label="Monto"
            type="number"
            step="0.01"
            min="0.01"
            value={inAmount}
            onChange={(e) => setInAmount(Number(e.target.value))}
            required
          />
          <Input
            label="Descripción"
            value={inDescription}
            onChange={(e) => setInDescription(e.target.value)}
            placeholder="Descripción (opcional)"
          />
          <Input
            label="Referencia"
            value={inReference}
            onChange={(e) => setInReference(e.target.value)}
            placeholder="Referencia (opcional)"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowIn(false); setInAmount(0); setInDescription(""); setInReference("") }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={mutLoading}>
              Registrar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Egreso Modal */}
      <Modal
        open={showOut}
        onClose={() => { setShowOut(false); setOutAmount(0); setOutDescription(""); setOutReference(""); setError("") }}
        title="Registrar Egreso"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addMovement("OUT", outAmount, outDescription, outReference)
          }}
          className="space-y-4"
        >
          <Input
            label="Monto"
            type="number"
            step="0.01"
            min="0.01"
            value={outAmount}
            onChange={(e) => setOutAmount(Number(e.target.value))}
            required
          />
          <Input
            label="Descripción"
            value={outDescription}
            onChange={(e) => setOutDescription(e.target.value)}
            placeholder="Descripción (opcional)"
          />
          <Input
            label="Referencia"
            value={outReference}
            onChange={(e) => setOutReference(e.target.value)}
            placeholder="Referencia (opcional)"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowOut(false); setOutAmount(0); setOutDescription(""); setOutReference("") }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={mutLoading}>
              Registrar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
