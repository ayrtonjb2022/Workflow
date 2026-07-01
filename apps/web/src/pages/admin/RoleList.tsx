import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Input } from "../../components/ui/Input.js"
import { Modal } from "../../components/ui/Modal.js"
import { Table, type Column } from "../../components/ui/Table.js"
import type { Role, Permission } from "../../types/admin.js"

interface RoleFormData {
  name: string
  description: string
  permissionIds: string[]
}

function RoleForm({
  initial,
  permissions,
  onSave,
  loading,
}: {
  initial?: Role
  permissions: Permission[]
  onSave: (data: RoleFormData) => void
  loading: boolean
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initial?.rolePermissions.map((rp) => rp.permission.id) ?? [],
  )

  const grouped = permissions.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      ;(acc[p.resource] ??= []).push(p)
      return acc
    },
    {},
  )

  const togglePermission = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name: name.trim(), description: description.trim(), permissionIds: selectedIds })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del rol"
        required
      />
      <Input
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción del rol"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Permisos
        </label>
        <div className="max-h-64 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-3">
          {Object.entries(grouped).map(([resource, perms]) => (
            <div key={resource}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {resource}
              </p>
              <div className="flex flex-wrap gap-3">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {perm.action}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {initial ? "Guardar cambios" : "Crear rol"}
        </Button>
      </div>
    </form>
  )
}

export default function RoleList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [error, setError] = useState("")

  const { data: roles, isLoading, isError, refetch } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api<Role[]>("/roles"),
  })

  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api<Permission[]>("/permissions"),
    enabled: createOpen || !!editRole,
  })

  const createMutation = useMutation({
    mutationFn: (data: RoleFormData) =>
      api("/roles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setCreateOpen(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoleFormData> }) =>
      api(`/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: data.name, description: data.description }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setEditRole(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (r) => (
        <span className="font-medium text-gray-900">{r.name}</span>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      render: (r) => (
        <span className="text-gray-500">{r.description ?? "—"}</span>
      ),
    },
    {
      key: "permissions",
      header: "Permisos",
      render: (r) => (
        <span className="text-gray-500">{r.rolePermissions.length}</span>
      ),
    },
    {
      key: "users",
      header: "Usuarios",
      render: (r) => (
        <span className="text-gray-500">{r._count?.users ?? 0}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/admin/roles/${r.id}`)
            }}
          >
            Ver
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              setEditRole(r)
            }}
          >
            Editar
          </Button>
          {!r.isSystem && (
            <Button
              size="sm"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`¿Eliminar el rol "${r.name}"?`)) {
                  deleteMutation.mutate(r.id)
                }
              }}
              loading={deleteMutation.isPending && deleteMutation.variables === r.id}
            >
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <Button onClick={() => setCreateOpen(true)}>Nuevo Rol</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar los roles</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isError && (
        <Table
          columns={columns}
          data={roles ?? []}
          loading={isLoading}
          emptyMessage="No se encontraron roles"
        />
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo Rol"
      >
        {permissions && (
          <RoleForm
            permissions={permissions}
            loading={createMutation.isPending}
            onSave={(data) => {
              setError("")
              createMutation.mutate(data)
            }}
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editRole}
        onClose={() => setEditRole(null)}
        title="Editar Rol"
      >
        {editRole && permissions && (
          <RoleForm
            initial={editRole}
            permissions={permissions}
            loading={updateMutation.isPending}
            onSave={(data) => {
              setError("")
              updateMutation.mutate({ id: editRole.id, data })
            }}
          />
        )}
      </Modal>
    </div>
  )
}
