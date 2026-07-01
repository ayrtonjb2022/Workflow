import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, AppError } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Input } from "../../components/ui/Input.js"
import { Modal } from "../../components/ui/Modal.js"
import { Table, type Column } from "../../components/ui/Table.js"
import type { User } from "../../types/admin.js"

interface CreateUserForm {
  name: string
  email: string
  password: string
}

export default function UserList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateUserForm>({
    name: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("")

  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<User[]>("/users"),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateUserForm) =>
      api("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setCreateOpen(false)
      setForm({ name: "", email: "", password: "" })
    },
    onError: (err: Error) =>
      setError(err instanceof AppError ? err.message : "Error al crear usuario"),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (u) => (
        <span className="font-medium text-gray-900">{u.name}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (u) => <span className="text-gray-600">{u.email}</span>,
    },
    {
      key: "roles",
      header: "Roles",
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 && (
            <span className="text-gray-400 text-xs">Sin roles</span>
          )}
          {u.roles.map((r) => (
            <span
              key={r.role.id}
              className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
            >
              {r.role.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "active",
      header: "Estado",
      render: (u) =>
        u.active ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            Inactivo
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={u.active ? "danger" : "secondary"}
            loading={
              toggleActiveMutation.isPending &&
              toggleActiveMutation.variables?.id === u.id
            }
            onClick={(e) => {
              e.stopPropagation()
              toggleActiveMutation.mutate({
                id: u.id,
                active: !u.active,
              })
            }}
          >
            {u.active ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Todos los campos son obligatorios")
      return
    }
    setError("")
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <Button onClick={() => setCreateOpen(true)}>Nuevo Usuario</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar los usuarios</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isError && (
        <Table
          columns={columns}
          data={users ?? []}
          loading={isLoading}
          emptyMessage="No se encontraron usuarios"
          onRowClick={(u) => navigate(`/admin/users/${u.id}`)}
        />
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setError("")
        }}
        title="Nuevo Usuario"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nombre del usuario"
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="usuario@email.com"
          />
          <Input
            label="Contraseña *"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Contraseña"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreateOpen(false)
                setError("")
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
