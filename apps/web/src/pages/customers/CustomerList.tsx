import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Modal } from "../../components/ui/Modal.js"
import { Table, type Column } from "../../components/ui/Table.js"
import { Pagination } from "../../components/ui/Pagination.js"
import { SearchBar } from "../../components/ui/SearchBar.js"
import type { Customer, PaginatedResponse } from "../../types/customer.js"
import CreateCustomerModal from "./CreateCustomerModal.js"

export default function CustomerList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const limit = 20

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customers", { page, limit, search }],
    queryFn: () =>
      api<PaginatedResponse<Customer>>(
        `/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      setDeletingId(null)
    },
  })

  const handleExport = async () => {
    const response = await fetch("/api/customers/export", { credentials: "include" })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const columns: Column<Customer>[] = [
    { key: "name", header: "Nombre", render: (c) => c.name },
    { key: "email", header: "Email", render: (c) => c.email ?? "—" },
    {
      key: "document",
      header: "Documento",
      render: (c) => `${c.documentType}: ${c.documentNumber}`,
    },
    { key: "phone", header: "Teléfono", render: (c) => c.phone ?? "—" },
    {
      key: "active",
      header: "Estado",
      render: (c) => (c.active ? "Activo" : "Inactivo"),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setDeletingId(c.id)
          }}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Eliminar
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Exportar
          </Button>
          <Button onClick={() => setShowCreate(true)}>Nuevo Cliente</Button>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={handleSearch}
        placeholder="Buscar por nombre, email o documento..."
      />

      {/* Error state */}
      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar los clientes</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Loading / Empty / Table */}
      {!isError && (
        <>
          <Table
            columns={columns}
            data={data?.data ?? []}
            loading={isLoading}
            emptyMessage="No se encontraron clientes"
            onRowClick={(c) => navigate(`/customers/${c.id}`)}
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

      {/* Create modal */}
      {showCreate && (
        <CreateCustomerModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            setShowCreate(false)
          }}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Eliminar cliente"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro de que querés eliminar este cliente? Esta acción no se
          puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletingId(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => {
              if (deletingId) deleteMutation.mutate(deletingId)
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
