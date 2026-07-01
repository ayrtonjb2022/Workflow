import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Table, type Column } from "../../components/ui/Table.js"
import { Pagination } from "../../components/ui/Pagination.js"
import { SearchBar } from "../../components/ui/SearchBar.js"
import StatusBadge from "./components/StatusBadge.js"
import type { Invoice, PaginatedResponse } from "../../types/sales.js"

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Borrador" },
  { value: "SENT", label: "Enviado" },
  { value: "PAID", label: "Pagado" },
  { value: "CANCELLED", label: "Cancelado" },
]

export default function InvoiceList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const navigate = useNavigate()
  const limit = 20

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoices", { page, limit, search, status: statusFilter }],
    queryFn: () =>
      api<PaginatedResponse<Invoice>>(
        `/invoices?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${statusFilter}`,
      ),
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const columns: Column<Invoice>[] = [
    {
      key: "number",
      header: "Número",
      render: (i) => i.number,
    },
    {
      key: "customer",
      header: "Cliente",
      render: (i) => i.customer.name,
    },
    {
      key: "date",
      header: "Fecha",
      render: (i) => new Date(i.date).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Estado",
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: "total",
      header: "Total",
      render: (i) => `$${i.total.toFixed(2)}`,
    },
    {
      key: "paid",
      header: "Pagado",
      render: (i) => {
        const paid = i.paidAmount ?? 0
        const isFullyPaid = paid >= i.total
        return (
          <span className={isFullyPaid ? "text-green-600 font-medium" : "text-gray-900"}>
            ${paid.toFixed(2)} / ${i.total.toFixed(2)}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
        <Button onClick={() => navigate("/sales/invoices/new")}>
          Nueva Factura
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Buscar por número o cliente..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar las facturas</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isError && (
        <>
          <Table
            columns={columns}
            data={data?.data ?? []}
            loading={isLoading}
            emptyMessage="No se encontraron facturas"
            onRowClick={(i) => navigate(`/sales/invoices/${i.id}`)}
          />

          {data && (
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
