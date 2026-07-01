import { useParams, useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import type { User, Role } from "../../types/admin.js"

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", id],
    queryFn: () => api<User>(`/users/${id}`),
    enabled: !!id,
  })

  const { data: allRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api<Role[]>("/roles"),
  })

  // Roles NOT yet assigned to this user
  const assignedRoleIds = new Set(user?.roles.map((r) => r.role.id) ?? [])
  const availableRoles =
    allRoles?.filter((r) => !assignedRoleIds.has(r.id)) ?? []

  // We use POST /roles/:roleId/users to assign, using a select + confirm pattern
  // For simplicity, show a select and assign button inline
  const assignMutation = useMutation({
    mutationFn: (roleId: string) =>
      api(`/roles/${roleId}/users`, {
        method: "POST",
        body: JSON.stringify({ userId: id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", id] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const removeRoleMutation = useMutation({
    mutationFn: (roleId: string) =>
      api(`/roles/${roleId}/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", id] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const handleAssignRole = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value
    if (!roleId) return
    assignMutation.mutate(roleId)
    // Reset select
    e.target.value = ""
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error al cargar el usuario</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Reintentar
        </Button>
        <Button
          variant="ghost"
          className="ml-2"
          onClick={() => navigate("/admin/users")}
        >
          Volver a usuarios
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/admin/users")}
        className="text-sm text-blue-600 hover:text-blue-800 inline-block"
      >
        &larr; Volver a usuarios
      </button>

      {/* Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          {user.active ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Activo
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              Inactivo
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Creado</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
          <div className="flex items-center gap-2">
            {availableRoles.length > 0 && (
              <select
                value=""
                onChange={handleAssignRole}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Asignar rol...</option>
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {user.roles.length === 0 ? (
          <p className="text-sm text-gray-500">
            Este usuario no tiene roles asignados.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.roles.map(({ role }) => (
              <div
                key={role.id}
                className="inline-flex items-center gap-2 rounded-full bg-blue-100 pl-3 pr-1 py-1 text-sm font-medium text-blue-800"
              >
                <span>{role.name}</span>
                <button
                  type="button"
                  onClick={() => removeRoleMutation.mutate(role.id)}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-blue-200 transition-colors"
                  title="Quitar rol"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
