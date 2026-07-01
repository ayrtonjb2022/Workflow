import { useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import StockAdjustModal from "./components/StockAdjustModal.js"
import type { Product } from "../../types/products.js"

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", id],
    queryFn: () => api<Product>(`/products/${id}`),
    enabled: !!id,
  })

  const deactivateMutation = useMutation({
    mutationFn: () => api(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", id] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  const handleAdjustStockSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["products", id] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error al cargar el producto</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Reintentar
        </Button>
        <Button
          variant="ghost"
          className="ml-2"
          onClick={() => navigate("/inventory/products")}
        >
          Volver a productos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/inventory/products")}
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            &larr; Volver a productos
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {product.name}
            </h1>
            {product.active
              ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activo
                </span>
              )
              : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactivo
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Información</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Código</p>
            <p className="text-sm font-medium text-gray-900">{product.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nombre</p>
            <p className="text-sm font-medium text-gray-900">{product.name}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Descripción</p>
            <p className="text-sm text-gray-900">
              {product.description ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Categoría</p>
            <p className="text-sm font-medium text-gray-900">
              {product.category?.name ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Precios</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Precio Unitario</p>
            <p className="text-lg font-semibold text-gray-900">
              ${Number(product.unitPrice).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Costo</p>
            <p className="text-lg font-semibold text-gray-900">
              ${Number(product.costPrice).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Stock card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Stock</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Stock Actual</p>
            <p className={`text-lg font-semibold ${product.stock <= product.minStock ? "text-amber-600" : "text-gray-900"}`}>
              {product.stock}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Stock Mínimo</p>
            <p className="text-lg font-semibold text-gray-900">
              {product.minStock}
            </p>
          </div>
        </div>
        {product.stock <= product.minStock && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-800 font-medium">
              ⚠ Stock por debajo del mínimo
            </p>
          </div>
        )}
      </div>

      {/* Dates card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Fechas</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Creado</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Actualizado</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(product.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inventory/products/${id}/edit`)}
          >
            Editar
          </Button>
          <Button
            variant="secondary"
            onClick={() => setAdjustModalOpen(true)}
          >
            Ajustar Stock
          </Button>
          <Button
            variant="danger"
            loading={deactivateMutation.isPending}
            onClick={() => {
              if (window.confirm(
                `¿Estás seguro de que deseas ${product.active ? "desactivar" : "activar"} este producto?`,
              )) {
                deactivateMutation.mutate()
              }
            }}
          >
            {product.active ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </div>

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        productId={product.id}
        productName={product.name}
        onSuccess={handleAdjustStockSuccess}
      />
    </div>
  )
}
