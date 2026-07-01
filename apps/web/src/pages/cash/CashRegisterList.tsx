import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Modal } from "../../components/ui/Modal.js"
import { Input } from "../../components/ui/Input.js"
import { Table, type Column } from "../../components/ui/Table.js"
import type { CashRegister } from "../../types/cash-register.js"
import type { Branch } from "../../types/settings.js"

export default function CashRegisterList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newBranchId, setNewBranchId] = useState("")

  const { data: registers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["cash-registers"],
    queryFn: () => api<CashRegister[]>("/cash-registers"),
  })

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => api<Branch[]>("/branches"),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; branchId?: string }) =>
      api("/cash-registers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] })
      setShowCreate(false)
      setNewName("")
      setNewBranchId("")
    },
  })

  const openMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/cash-registers/${id}/open`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/cash-registers/${id}/close`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] })
    },
  })

  const isOpen = (r: CashRegister) => r.openedAt && !r.closedAt
  const getLastMovementDate = (r: CashRegister) => {
    if (!r.cashMovements || r.cashMovements.length === 0) return null
    return r.cashMovements[0].createdAt
  }

  const columns: Column<CashRegister>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (r) => (
        <button
          type="button"
          onClick={() => navigate(`/cash/registers/${r.id}`)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {r.name}
        </button>
      ),
    },
    {
      key: "branch",
      header: "Sucursal",
      render: (r) => <span>{r.branch?.name ?? "—"}</span>,
    },
    {
      key: "balance",
      header: "Saldo",
      render: (r) => (
        <span className="font-medium">
          ${r.balance.toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (r) =>
        isOpen(r)
          ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Abierta
            </span>
          )
          : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Cerrada
            </span>
          ),
    },
    {
      key: "lastMovement",
      header: "Último Mov.",
      render: (r) => {
        const date = getLastMovementDate(r)
        return (
          <span className="text-gray-500">
            {date ? new Date(date).toLocaleDateString() : "—"}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Acciones",
      render: (r) =>
        r.active
          ? (
            <div className="flex items-center gap-2">
              {isOpen(r)
                ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={closeMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation()
                      closeMutation.mutate(r.id)
                    }}
                  >
                    Cerrar
                  </Button>
                )
                : (
                  <Button
                    size="sm"
                    loading={openMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation()
                      openMutation.mutate(r.id)
                    }}
                  >
                    Abrir
                  </Button>
                )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/cash/registers/${r.id}`)}
              >
                Ver detalle
              </Button>
            </div>
          )
          : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cajas</h1>
        <Button onClick={() => setShowCreate(true)}>Nueva Caja</Button>
      </div>

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar las cajas</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isError && (
        <Table
          columns={columns}
          data={registers}
          loading={isLoading}
          emptyMessage="No hay cajas registradas"
        />
      )}

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false)
          setNewName("")
          setNewBranchId("")
        }}
        title="Nueva Caja"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              name: newName,
              branchId: newBranchId || undefined,
            })
          }}
          className="space-y-4"
        >
          <Input
            label="Nombre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la caja"
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Sucursal
            </label>
            <select
              value={newBranchId}
              onChange={(e) => setNewBranchId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sin sucursal</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreate(false)
                setNewName("")
                setNewBranchId("")
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!newName.trim()}
            >
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
