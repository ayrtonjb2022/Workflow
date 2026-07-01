import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Table, type Column } from "../../components/ui/Table.js"
import { Button } from "../../components/ui/Button.js"
import StatusBadge from "../sales/components/StatusBadge.js"
import type { SalesReport, StockReport, StockProduct } from "../../types/reports.js"

function formatCurrency(n: number) {
  return `$${n.toFixed(2)}`
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString()
}

function todayString() {
  const d = new Date()
  return d.toISOString().split("T")[0]
}

function thirtyDaysAgoString() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split("T")[0]
}

// ── Summary card ─────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: "green" | "blue" | "amber" | "red"
}) {
  const colorClasses: Record<string, string> = {
    green: "bg-green-50 border-green-200 text-green-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-800",
  }
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-1 ${colorClasses[color]}`}
    >
      <span className="text-sm font-medium opacity-80">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  )
}

// ── Stock status badge ───────────────────────────────────────
function StockBadge({ status }: { status: StockProduct["status"] }) {
  const styles: Record<StockProduct["status"], string> = {
    ok: "bg-green-100 text-green-800",
    low: "bg-amber-100 text-amber-800",
    critical: "bg-red-100 text-red-800",
  }
  const labels: Record<StockProduct["status"], string> = {
    ok: "OK",
    low: "Bajo",
    critical: "Sin Stock",
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

// ── Tabs ──────────────────────────────────────────────────────
const tabs = [
  { key: "ventas", label: "Ventas" },
  { key: "stock", label: "Stock" },
] as const

type TabKey = (typeof tabs)[number]["key"]

// ═══════════════════════════════════════════════════════════════
//  Sales Tab
// ═══════════════════════════════════════════════════════════════
function SalesTab() {
  const [from, setFrom] = useState(thirtyDaysAgoString())
  const [to, setTo] = useState(todayString())
  const [appliedFrom, setAppliedFrom] = useState(from)
  const [appliedTo, setAppliedTo] = useState(to)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports", "sales", appliedFrom, appliedTo],
    queryFn: () =>
      api<SalesReport>(
        `/reports/sales?from=${encodeURIComponent(appliedFrom)}&to=${encodeURIComponent(appliedTo)}`,
      ),
  })

  const handleApply = () => {
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  // byDay columns
  const dayColumns: Column<SalesReport["byDay"][number]>[] = [
    {
      key: "date",
      header: "Fecha",
      render: (r) => formatDate(r.date),
    },
    {
      key: "count",
      header: "Cantidad",
      render: (r) => r.count.toString(),
    },
    {
      key: "revenue",
      header: "Ingresos",
      render: (r) => formatCurrency(r.revenue),
    },
  ]

  // byStatus columns
  const statusColumns: Column<SalesReport["byStatus"][number]>[] = [
    {
      key: "status",
      header: "Estado",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "count",
      header: "Cantidad",
      render: (r) => r.count.toString(),
    },
    {
      key: "total",
      header: "Total",
      render: (r) => formatCurrency(r.total),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button onClick={handleApply}>Aplicar</Button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Ingresos Totales"
            value={formatCurrency(data.totalRevenue)}
            color="green"
          />
          <SummaryCard
            label="Facturas Emitidas"
            value={data.totalInvoices.toString()}
            color="blue"
          />
          <SummaryCard
            label="Ticket Promedio"
            value={formatCurrency(data.averageTicket)}
            color="amber"
          />
          <SummaryCard
            label="Facturas Pendientes"
            value={data.pendingInvoices.toString()}
            color="red"
          />
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar el reporte</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Tables */}
      {data && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Ventas por Día
            </h2>
            <Table
              columns={dayColumns}
              data={data.byDay}
              loading={isLoading}
              emptyMessage="Sin ventas en el período"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Por Estado
            </h2>
            <Table
              columns={statusColumns}
              data={data.byStatus}
              loading={isLoading}
              emptyMessage="Sin facturas en el período"
            />
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Stock Tab
// ═══════════════════════════════════════════════════════════════
function StockTab() {
  const [lowOnly, setLowOnly] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports", "stock", lowOnly],
    queryFn: () =>
      api<StockReport>(`/reports/stock?lowOnly=${lowOnly}`),
  })

  const columns: Column<StockProduct>[] = [
    {
      key: "code",
      header: "Código",
      render: (p) => (
        <span className="font-mono text-sm">{p.code}</span>
      ),
    },
    {
      key: "name",
      header: "Producto",
      render: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: "category",
      header: "Categoría",
      render: (p) => p.category ?? <span className="text-gray-400">—</span>,
    },
    {
      key: "stock",
      header: "Stock",
      render: (p) => p.stock.toString(),
    },
    {
      key: "minStock",
      header: "Stock Mínimo",
      render: (p) => p.minStock.toString(),
    },
    {
      key: "status",
      header: "Estado",
      render: (p) => <StockBadge status={p.status} />,
    },
    {
      key: "unitPrice",
      header: "Precio",
      render: (p) => formatCurrency(p.unitPrice),
    },
  ]

  const lowStockItems = data?.products.filter((p) => p.status !== "ok")
  const criticalItems = data?.products.filter((p) => p.status === "critical")

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={lowOnly}
          onChange={(e) => setLowOnly(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">
          Solo stock bajo
        </span>
      </label>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard
            label="Total Productos"
            value={data.totalProducts.toString()}
            color="blue"
          />
          <SummaryCard
            label="Stock Bajo"
            value={(lowStockItems?.length ?? 0).toString()}
            color="amber"
          />
          <SummaryCard
            label="Sin Stock"
            value={(criticalItems?.length ?? 0).toString()}
            color="red"
          />
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar el reporte</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {data && (
        <Table
          columns={columns}
          data={data.products}
          loading={isLoading}
          emptyMessage={
            lowOnly
              ? "No hay productos con stock bajo"
              : "No hay productos registrados"
          }
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ventas")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "ventas" ? <SalesTab /> : <StockTab />}
    </div>
  )
}
