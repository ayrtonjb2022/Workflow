import { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Table, type Column } from "../../components/ui/Table.js"
import { Pagination } from "../../components/ui/Pagination.js"
import { SearchBar } from "../../components/ui/SearchBar.js"
import type { Product, Category, PaginatedResponse } from "../../types/products.js"

export default function ProductList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const navigate = useNavigate()
  const limit = 20

  // Fetch categories for filter dropdown
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", { page, limit, search, categoryId: categoryFilter }],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      if (search) params.set("search", search)
      if (categoryFilter) params.set("categoryId", categoryFilter)
      return api<PaginatedResponse<Product>>(`/products?${params.toString()}`)
    },
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const columns: Column<Product>[] = [
    {
      key: "code",
      header: "Código",
      render: (p) => p.code,
    },
    {
      key: "name",
      header: "Nombre",
      render: (p) => p.name,
    },
    {
      key: "category",
      header: "Categoría",
      render: (p) => p.category?.name ?? "—",
    },
    {
      key: "unitPrice",
      header: "P. Unitario",
      render: (p) => `$${Number(p.unitPrice).toFixed(2)}`,
    },
    {
      key: "costPrice",
      header: "C. Costo",
      render: (p) => `$${Number(p.costPrice).toFixed(2)}`,
    },
    {
      key: "stock",
      header: "Stock",
      render: (p) => (
        <span className={p.stock <= p.minStock ? "text-amber-600 font-semibold" : ""}>
          {p.stock}
        </span>
      ),
    },
    {
      key: "minStock",
      header: "Stock Mín.",
      render: (p) => p.minStock,
    },
    {
      key: "status",
      header: "Estado",
      render: (p) =>
        p.active
          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
          : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactivo</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <Button onClick={() => navigate("/inventory/products/new")}>
          Nuevo Producto
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Buscar por código o nombre..."
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar los productos</p>
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
            emptyMessage="No hay productos"
            onRowClick={(p) => navigate(`/inventory/products/${p.id}`)}
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
