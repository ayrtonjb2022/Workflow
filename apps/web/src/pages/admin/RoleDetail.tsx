import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Modal } from "../../components/ui/Modal.js"
import type { Role, Permission, User } from "../../types/admin.js"

export default function RoleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [assignUserOpen, setAssignUserOpen] = useState(false)
  const [error, setError] = useState("")

  const { data: role, isLoading, isError, refetch } = useQuery({
    queryKey: ["roles", id],
    queryFn: () => api<Role>(`/roles/${id}`),
    enabled: !!id,
  })

  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api<Permission[]>("/permissions"),
  })

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<User[]>("/users"),
  })

  const rolePermissionIds = new Set(
    role?.rolePermissions.map((rp) => rp.permission.id) ?? [],
  )

  const [selectedIds, setSelectedIds] = useState<Set<string>>(rolePermissionIds)
  const [dirty, setDirty] = useState(false)

  // Sync local selection when role data loads/reloads, but only if not dirty
  useEffect(() => {
    if (role && !dirty) {
      setSelectedIds(
        new Set(role.rolePermissions.map((rp) => rp.permission.id)),
      )
    }
  }, [role?.id, role?.rolePermissions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = (permissions ?? []).reduce<Record<string, Permission[]>>(
    (acc, p) => {
      ;(acc[p.resource] ??= []).push(p)
      return acc
    },
    {},
  )

  const togglePermission = (permId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(permId)) next.delete(permId)
      else next.add(permId)
      return next
    })
    setDirty(true)
  }

  const permissionsMutation = useMutation({
    mutationFn: (permissionIds: string[]) =>
      api(`/roles/${id}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", id] })
      setDirty(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  const assignMutation = useMutation({
    mutationFn: (userId: string) =>
      api(`/roles/${id}/users`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", id] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setAssignUserOpen(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  const removeUserMutation = useMutation({
    mutationFn: (userId: string) =>
      api(`/roles/${id}/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", id] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: Error) => setError(err.message),
  })

  // Users assigned to this role
  const assignedUsers =
    allUsers?.filter((u) => u.roles.some((r) => r.role.id === id)) ?? []

  // Users NOT assigned to this role (and active)
  const availableUsers =
    allUsers?.filter(
      (u) => u.active && !u.roles.some((r) => r.role.id === id),
    ) ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !role) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error al cargar el rol</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Reintentar
        </Button>
        <Button
          variant="ghost"
          className="ml-2"
          onClick={() => navigate("/admin/roles")}
        >
          Volver a roles
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
            onClick={() => navigate("/admin/roles")}
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            &larr; Volver a roles
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>
            {role.isSystem && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                Sistema
              </span>
            )}
          </div>
          {role.description && (
            <p className="text-sm text-gray-500 mt-1">{role.description}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Permissions Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Permisos</h2>
          {dirty && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => {
                setSelectedIds(rolePermissionIds)
                setDirty(false)
              }}>
                Cancelar
              </Button>
              <Button
                size="sm"
                loading={permissionsMutation.isPending}
                onClick={() =>
                  permissionsMutation.mutate(Array.from(selectedIds))
                }
              >
                Guardar permisos
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {Object.entries(grouped).map(([resource, perms]) => (
            <div key={resource}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {resource}
              </p>
              <div className="flex flex-wrap gap-4">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{perm.action}</span>
                    {perm.description && (
                      <span className="text-gray-400 text-xs ml-1">
                        ({perm.description})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Usuarios asignados
          </h2>
          <Button size="sm" onClick={() => setAssignUserOpen(true)}>
            Asignar Usuario
          </Button>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : assignedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ningún usuario tiene este rol asignado.
          </p>
        ) : (
          <div className="divide-y divide-gray-200">
            {assignedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  loading={
                    removeUserMutation.isPending &&
                    removeUserMutation.variables === user.id
                  }
                  onClick={() => removeUserMutation.mutate(user.id)}
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign User Modal */}
      <Modal
        open={assignUserOpen}
        onClose={() => setAssignUserOpen(false)}
        title="Asignar Usuario"
      >
        <div className="space-y-3">
          {availableUsers.length === 0 && (
            <p className="text-sm text-gray-500">
              No hay usuarios disponibles para asignar.
            </p>
          )}
          {availableUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <Button
                size="sm"
                loading={assignMutation.isPending}
                onClick={() => assignMutation.mutate(user.id)}
              >
                Asignar
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
