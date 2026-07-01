import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api.js"
import { useAuth } from "../providers/AuthProvider.js"
import { Button } from "../components/ui/Button.js"
import {
  FontAwesomeIcon,
  type FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome"
import {
  faFileInvoice,
  faCartShopping,
  faReceipt,
  faTriangleExclamation,
  faDownload,
  faPlus,
} from "@fortawesome/free-solid-svg-icons"

// ── Types ──

interface RecentActivityItem {
  type: "quote" | "order" | "invoice"
  id: string
  number: string
  status: string
  customerName: string
  total: number
  createdAt: string
}

interface DashboardStats {
  monthlyRevenue: number
  monthlyInvoices: number
  pendingOrders: number
  openQuotes: number
  lowStockProducts: number
  recentActivity: RecentActivityItem[]
  topProducts: { name: string; totalSold: number; revenue: number }[]
}

interface LowStockProduct {
  id: string
  name: string
  stock: number
  minStock: number
}

interface PaginatedResponse {
  data: LowStockProduct[]
  total: number
}

// ── Helpers ──

const typeMeta: Record<
  string,
  { icon: FontAwesomeIconProps["icon"]; color: string; label: string }
> = {
  quote: {
    icon: faFileInvoice,
    color: "text-wave bg-wave/10",
    label: "Cotización",
  },
  order: {
    icon: faCartShopping,
    color: "text-gold bg-gold/10",
    label: "Pedido",
  },
  invoice: {
    icon: faReceipt,
    color: "text-seal bg-seal/10",
    label: "Factura",
  },
}

function getActivityPath(item: RecentActivityItem): string {
  switch (item.type) {
    case "quote":
      return `/sales/quotes/${item.id}`
    case "order":
      return `/sales/orders/${item.id}`
    case "invoice":
      return `/sales/invoices/${item.id}`
  }
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

/** Compact currency like $42.8K */
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

// ── Card configuration ──

interface CardDef {
  key: keyof DashboardStats
  label: string
  icon: FontAwesomeIconProps["icon"]
  accent: string
  format: "number" | "currency"
  trend?: string
}

const cards: CardDef[] = [
  {
    key: "openQuotes",
    label: "Cotizaciones",
    icon: faFileInvoice,
    accent: "text-wave bg-wave/10",
    format: "number",
    trend: "+12%",
  },
  {
    key: "pendingOrders",
    label: "Pedidos",
    icon: faCartShopping,
    accent: "text-gold bg-gold/10",
    format: "number",
    trend: "+8%",
  },
  {
    key: "monthlyRevenue",
    label: "Facturación",
    icon: faReceipt,
    accent: "text-emerald-600 bg-emerald-50",
    format: "currency",
    trend: "+5.2%",
  },
  {
    key: "lowStockProducts",
    label: "Stock Crítico",
    icon: faTriangleExclamation,
    accent: "text-seal bg-seal/10",
    format: "number",
  },
]

// ── Stat Card sub-component ──

function StatCard({ def, value }: { def: CardDef; value: number }) {
  const display =
    def.format === "currency" ? formatCompact(value) : String(value)

  return (
    <div className="bg-card rounded-[20px] border border-ink/60 p-5 shadow-soft hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${def.accent}`}
        >
          <FontAwesomeIcon icon={def.icon} className="w-5 h-5" />
        </div>
        {def.trend && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            ↑ {def.trend}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-muted mb-0.5">{def.label}</p>
      <p className="text-2xl font-bold text-dark tabular-nums">{display}</p>
    </div>
  )
}

// ── Main Component ──

export default function Welcome() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ── Queries ──

  const { data, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => api("/dashboard/stats"),
  })

  const { data: productsData } = useQuery<PaginatedResponse>({
    queryKey: ["dashboard-products"],
    queryFn: () => api("/products?limit=200"),
    staleTime: 60_000,
  })

  const lowStock: LowStockProduct[] = (productsData?.data ?? [])
    .filter((p) => p.stock < p.minStock)
    .slice(0, 5)

  // ── Derived name ──

  const firstName = user?.name?.split(" ")[0] ?? "Usuario"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ════════════════════════════════════════════
          Page header
          ════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">
            Bienvenido, {firstName}
          </h1>
          <p className="text-muted text-sm mt-1">
            Resumen de operaciones del mes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            Exportar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/sales/quotes/new")}
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          Loading state
          ════════════════════════════════════════════ */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <span className="animate-spin h-8 w-8 border-2 border-wave border-t-transparent rounded-full" />
        </div>
      )}

      {/* ════════════════════════════════════════════
          Error state
          ════════════════════════════════════════════ */}
      {isError && (
        <div className="text-center py-24 bg-card rounded-[20px] border border-ink/60 shadow-soft">
          <p className="text-seal font-medium mb-4">
            Error al cargar el dashboard
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* ════════════════════════════════════════════
          Dashboard content
          ════════════════════════════════════════════ */}
      {data && (
        <>
          {/* ── Stats grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((def) => (
              <StatCard key={def.key} def={def} value={Number(data[def.key])} />
            ))}
          </div>

          {/* ── Two-column section ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent activity */}
            <div className="bg-card rounded-[20px] border border-ink/60 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-dark">
                  Últimos movimientos
                </h2>
                <button
                  type="button"
                  className="text-xs font-medium text-muted hover:text-wave transition-colors"
                  onClick={() => navigate("/sales/invoices")}
                >
                  Ver todos &rarr;
                </button>
              </div>

              {data.recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {data.recentActivity.slice(0, 5).map((item, idx) => {
                    const meta = typeMeta[item.type] ?? typeMeta.invoice
                    return (
                      <div
                        key={`${item.type}-${item.id}-${idx}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-paper cursor-pointer transition-colors"
                        onClick={() => navigate(getActivityPath(item))}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}
                        >
                          <FontAwesomeIcon
                            icon={meta.icon}
                            className="w-4 h-4"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark truncate">
                            {item.customerName}
                          </p>
                          <p className="text-xs text-muted">
                            {meta.label} &middot; {item.number}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-dark tabular-nums">
                            ${item.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted tabular-nums">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted text-center py-10">
                  Sin movimientos recientes
                </p>
              )}
            </div>

            {/* Critical stock */}
            <div className="bg-card rounded-[20px] border border-ink/60 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-dark">
                  Stock crítico
                </h2>
                <button
                  type="button"
                  className="text-xs font-medium text-muted hover:text-wave transition-colors"
                  onClick={() => navigate("/inventory/products")}
                >
                  Gestionar &rarr;
                </button>
              </div>

              {lowStock.length > 0 ? (
                <div className="space-y-1">
                  {lowStock.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-paper transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/inventory/products/${product.id}`)
                      }
                    >
                      <div className="w-9 h-9 rounded-lg bg-seal/10 flex items-center justify-center shrink-0">
                        <FontAwesomeIcon
                          icon={faTriangleExclamation}
                          className="w-4 h-4 text-seal"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted">
                          Stock: {product.stock} &middot; Mín: {product.minStock}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                          product.stock === 0
                            ? "bg-seal/10 text-seal"
                            : "bg-gold/10 text-gold"
                        }`}
                      >
                        {product.stock === 0 ? "Sin stock" : `${product.stock} uds`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : data.lowStockProducts > 0 ? (
                <p className="text-sm text-muted text-center py-10">
                  Cargando productos...
                </p>
              ) : (
                <p className="text-sm text-muted text-center py-10">
                  No hay productos con stock bajo
                </p>
              )}
            </div>
          </div>

          {/* ── Top products table ── */}
          {data.topProducts.length > 0 && (
            <div className="bg-card rounded-[20px] border border-ink/60 p-5 shadow-soft">
              <h2 className="text-base font-semibold text-dark mb-4">
                Productos más vendidos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/40 text-left">
                      <th className="pb-3 font-semibold text-muted text-xs uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="pb-3 font-semibold text-muted text-xs uppercase tracking-wider text-right">
                        Cantidad
                      </th>
                      <th className="pb-3 font-semibold text-muted text-xs uppercase tracking-wider text-right">
                        Ingresos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-ink/20 last:border-0"
                      >
                        <td className="py-3 text-dark font-medium">
                          {p.name}
                        </td>
                        <td className="py-3 text-muted text-right tabular-nums">
                          {p.totalSold}
                        </td>
                        <td className="py-3 text-dark font-semibold text-right tabular-nums">
                          {formatCurrency(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
