import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Table, type Column } from "../../components/ui/Table.js"
import { Pagination } from "../../components/ui/Pagination.js"
import { SearchBar } from "../../components/ui/SearchBar.js"
import StatusBadge from "./components/StatusBadge.js"
import type { Quote, PaginatedResponse } from "../../types/sales.js"

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Borrador" },
  { value: "SENT", label: "Enviado" },
  { value: "ACCEPTED", label: "Aceptado" },
  { value: "REJECTED", label: "Rechazado" },
]

export default function QuoteList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const navigate = useNavigate()
  const limit = 20

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["quotes", { page, limit, search, status: statusFilter }],
    queryFn: () =>
      api<PaginatedResponse<Quote>>(
        `/quotes?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${statusFilter}`,
      ),
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const columns: Column<Quote>[] = [
    {
      key: "number",
      header: "Número",
      render: (q) => q.number,
    },
    {
      key: "customer",
      header: "Cliente",
      render: (q) => q.customer.name,
    },
    {
      key: "date",
      header: "Fecha",
      render: (q) => new Date(q.date).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Estado",
      render: (q) => <StatusBadge status={q.status} />,
    },
    {
      key: "total",
      header: "Total",
      render: (q) => `$${q.total.toFixed(2)}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <Button onClick={() => navigate("/sales/quotes/new")}>
          Nueva Cotización
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
          <p className="text-red-600 mb-4">Error al cargar las cotizaciones</p>
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
            emptyMessage="No se encontraron cotizaciones"
            onRowClick={(q) => navigate(`/sales/quotes/${q.id}`)}
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
