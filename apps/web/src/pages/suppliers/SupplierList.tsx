import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Modal } from "../../components/ui/Modal.js"
import { Table, type Column } from "../../components/ui/Table.js"
import { Pagination } from "../../components/ui/Pagination.js"
import { SearchBar } from "../../components/ui/SearchBar.js"
import type { Supplier, PaginatedResponse } from "../../types/supplier.js"
import CreateSupplierModal from "./components/CreateSupplierModal.js"

export default function SupplierList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const limit = 20

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["suppliers", { page, limit, search }],
    queryFn: () =>
      api<PaginatedResponse<Supplier>>(
        `/suppliers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      setDeletingId(null)
    },
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Nombre", render: (s) => s.name },
    { key: "email", header: "Email", render: (s) => s.email ?? "—" },
    {
      key: "document",
      header: "Documento",
      render: (s) => s.documentType && s.documentNumber ? `${s.documentType}: ${s.documentNumber}` : "—",
    },
    { key: "phone", header: "Teléfono", render: (s) => s.phone ?? "—" },
    {
      key: "active",
      header: "Estado",
      render: (s) => (s.active ? "Activo" : "Inactivo"),
    },
    {
      key: "actions",
      header: "",
      render: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setDeletingId(s.id)
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
        <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowCreate(true)}>Nuevo Proveedor</Button>
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
          <p className="text-red-600 mb-4">Error al cargar los proveedores</p>
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
            emptyMessage="No se encontraron proveedores"
            onRowClick={(s) => navigate(`/suppliers/${s.id}`)}
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
        <CreateSupplierModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] })
            setShowCreate(false)
          }}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Eliminar proveedor"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro de que querés eliminar este proveedor? Esta acción no se
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
