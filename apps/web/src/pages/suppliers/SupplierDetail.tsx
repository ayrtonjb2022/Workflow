import { useParams, useNavigate } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import type { Supplier } from "../../types/supplier.js"
import SupplierInfoCard from "./SupplierInfoCard.js"

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: supplier, isLoading, isError } = useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => api<Supplier>(`/suppliers/${id}`),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="mt-3 text-sm text-gray-500">Cargando proveedor...</p>
      </div>
    )
  }

  if (isError || !supplier) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error al cargar el proveedor</p>
        <button
          onClick={() => navigate("/suppliers")}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Volver a proveedores
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/suppliers")}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a proveedores
      </button>

      {/* Info card */}
      <SupplierInfoCard
        supplier={supplier}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: ["suppliers", id] })}
      />
    </div>
  )
}
