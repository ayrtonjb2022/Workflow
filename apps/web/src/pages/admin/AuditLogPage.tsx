import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHistory, faFilter, faEye, faTimes } from "@fortawesome/free-solid-svg-icons"
import { api } from "../../lib/api.js"
import { Pagination } from "../../components/ui/Pagination.js"

interface AuditLog {
  id: string
  tenantId: string
  userId: string
  entityType: string
  entityId: string
  action: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string
}

interface AuditLogResponse {
  items: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const ENTITY_TYPES = [
  "Quote", "Order", "Invoice", "Customer", "Contact",
  "Supplier", "Product", "Category", "User", "Role",
  "Branch", "Warehouse", "CashRegister",
]

function JsonViewer({ data, label }: { data: Record<string, unknown> | null; label: string }) {
  if (!data) return <span className="text-muted italic">—</span>

  return (
    <div className="mb-3">
      <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">{label}</h4>
      <pre className="bg-paper border border-ink rounded-lg p-3 text-xs overflow-x-auto max-h-60 scrollbar-thin">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
    SEND: "bg-purple-100 text-purple-800",
    CANCEL: "bg-orange-100 text-orange-800",
    ACCEPT: "bg-teal-100 text-teal-800",
    REJECT: "bg-rose-100 text-rose-800",
    PAY: "bg-emerald-100 text-emerald-800",
    OPEN: "bg-cyan-100 text-cyan-800",
    CLOSE: "bg-slate-100 text-slate-800",
    IN: "bg-lime-100 text-lime-800",
    OUT: "bg-amber-100 text-amber-800",
    ADJUSTMENT: "bg-violet-100 text-violet-800",
    CONVERT: "bg-indigo-100 text-indigo-800",
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[action] ?? "bg-gray-100 text-gray-800"}`}>
      {action}
    </span>
  )
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState("")
  const [userId, setUserId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const queryParams = new URLSearchParams()
  queryParams.set("page", String(page))
  queryParams.set("limit", "50")
  if (entityType) queryParams.set("entityType", entityType)
  if (userId) queryParams.set("userId", userId)
  if (startDate) queryParams.set("startDate", startDate)
  if (endDate) queryParams.set("endDate", endDate)

  const { data, isLoading, isError, refetch } = useQuery<AuditLogResponse>({
    queryKey: ["audit-logs", page, entityType, userId, startDate, endDate],
    queryFn: () => api(`/audit-logs?${queryParams.toString()}`),
  })

  const handleFilter = () => {
    setPage(1)
    refetch()
  }

  const handleClearFilters = () => {
    setEntityType("")
    setUserId("")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-wave/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faHistory} className="text-wave text-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Auditoría</h1>
            <p className="text-sm text-muted">Historial de cambios y operaciones</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showFilters
              ? "bg-wave text-white shadow-sm"
              : "bg-card text-muted border border-ink hover:text-dark hover:bg-ink/20"
          }`}
        >
          <FontAwesomeIcon icon={faFilter} className="text-sm" />
          Filtros
        </button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="text-center py-12">
          <p className="text-seal mb-4">Error al cargar el historial de auditoría</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-card text-muted border border-ink hover:text-dark"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border border-ink rounded-xl p-5 space-y-4 shadow-soft">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Tipo de Entidad
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="block w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave"
              >
                <option value="">Todos</option>
                {ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                ID de Usuario
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-id"
                className="block w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm text-dark placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Fecha Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleFilter}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-wave text-white hover:bg-wave/90 transition-all shadow-sm"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-card text-muted border border-ink hover:text-dark transition-all"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-ink bg-card shadow-soft">
        <table className="min-w-full divide-y divide-ink">
          <thead className="bg-paper">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Entidad</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Acción</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-ink/30 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.items.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted">
                      No se encontraron registros de auditoría
                    </td>
                  </tr>
                )
                : data?.items.map((log) => (
                    <tr key={log.id} className="hover:bg-ink/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark tabular-nums">
                        {new Date(log.createdAt).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted font-mono">
                        {log.userId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                        {log.entityType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted font-mono">
                        {log.entityId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-wave hover:bg-wave/10 transition-all"
                        >
                          <FontAwesomeIcon icon={faEye} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-dark/40" onClick={() => setSelectedLog(null)} aria-hidden="true" />
          <div className="relative bg-card rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto border border-ink">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink sticky top-0 bg-card z-10">
              <div className="flex items-center gap-3">
                <ActionBadge action={selectedLog.action} />
                <span className="text-sm font-medium text-dark">{selectedLog.entityType}</span>
                <span className="text-xs text-muted font-mono">{selectedLog.id.slice(0, 8)}...</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted hover:text-dark p-1 rounded-lg hover:bg-ink/20 transition-all"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Usuario</span>
                  <p className="text-sm text-dark font-mono mt-0.5">{selectedLog.userId}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">ID de Entidad</span>
                  <p className="text-sm text-dark font-mono mt-0.5">{selectedLog.entityId}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Tenant</span>
                  <p className="text-sm text-dark font-mono mt-0.5">{selectedLog.tenantId.slice(0, 12)}...</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Fecha</span>
                  <p className="text-sm text-dark mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="border-t border-ink pt-4">
                <JsonViewer data={selectedLog.before} label="Estado Anterior (before)" />
                <JsonViewer data={selectedLog.after} label="Estado Posterior (after)" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
