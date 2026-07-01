import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Table, type Column } from "../../components/ui/Table.js"
import type { Warehouse } from "../../types/settings.js"

export default function WarehouseList() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const { data: warehouses = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => api<Warehouse[]>("/warehouses"),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; address?: string }) =>
      api("/warehouses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      setIsAdding(false)
      setNewName("")
      setNewAddress("")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; address?: string } }) =>
      api(`/warehouses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      setEditingId(null)
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/warehouses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
    },
  })

  const columns: Column<Warehouse>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (w) =>
        editingId === w.id ? (
          <input
            type="text"
            defaultValue={w.name}
            className="rounded border border-gray-300 px-2 py-1 text-sm w-full"
            onBlur={(e) => {
              if (e.target.value !== w.name) {
                updateMutation.mutate({ id: w.id, data: { name: e.target.value } })
              } else {
                setEditingId(null)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingId(null)
              if (e.key === "Enter") (e.target as HTMLInputElement).blur()
            }}
            autoFocus
          />
        ) : (
          <span className="cursor-pointer hover:text-blue-600" onClick={() => setEditingId(w.id)}>
            {w.name}
          </span>
        ),
    },
    {
      key: "address",
      header: "Dirección",
      render: (w) => {
        if (editingId !== w.id) return <span>{w.address ?? "—"}</span>
        return (
          <input
            type="text"
            defaultValue={w.address ?? ""}
            className="rounded border border-gray-300 px-2 py-1 text-sm w-full"
            onBlur={(e) => {
              if (e.target.value !== (w.address ?? "")) {
                updateMutation.mutate({ id: w.id, data: { address: e.target.value || undefined } })
              } else {
                setEditingId(null)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingId(null)
              if (e.key === "Enter") (e.target as HTMLInputElement).blur()
            }}
          />
        )
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (w) =>
        w.active
          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
          : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactivo</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (w) =>
        w.active
          ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm("¿Desactivar este depósito?")) {
                  deactivateMutation.mutate(w.id)
                }
              }}
            >
              Desactivar
            </Button>
          )
          : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Depósitos</h1>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          Nuevo Depósito
        </Button>
      </div>

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar los depósitos</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isError && (
        <>
          {isAdding && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del depósito"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dirección (opcional)"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => createMutation.mutate({ name: newName, address: newAddress || undefined })}
                  disabled={!newName.trim() || createMutation.isPending}
                  loading={createMutation.isPending}
                >
                  Guardar
                </Button>
                <Button variant="secondary" onClick={() => { setIsAdding(false); setNewName(""); setNewAddress("") }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <Table
            columns={columns}
            data={warehouses}
            loading={isLoading}
            emptyMessage="No hay depósitos"
          />
        </>
      )}
    </div>
  )
}
