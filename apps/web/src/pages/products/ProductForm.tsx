import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, AppError } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Input } from "../../components/ui/Input.js"
import { Modal } from "../../components/ui/Modal.js"
import type { Product, Category } from "../../types/products.js"

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  // Quick-create category inline
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDesc, setNewCategoryDesc] = useState("")
  const [categoryError, setCategoryError] = useState("")

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [unitPrice, setUnitPrice] = useState(0)
  const [costPrice, setCostPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [minStock, setMinStock] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")

  // Load categories for select
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  })

  // Load existing product when editing
  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ["products", id],
    queryFn: () => api<Product>(`/products/${id}`),
    enabled: isEditing,
  })

  // Populate form when product data loads
  useEffect(() => {
    if (!productData) return
    setName(productData.name)
    setCode(productData.code)
    setDescription(productData.description ?? "")
    setCategoryId(productData.categoryId ?? "")
    setUnitPrice(Number(productData.unitPrice))
    setCostPrice(Number(productData.costPrice))
    setStock(productData.stock)
    setMinStock(productData.minStock)
  }, [productData])

  const validate = (): boolean => {
    const next: Record<string, string> = {}

    if (!name.trim()) {
      next.name = "Nombre requerido"
    }

    if (unitPrice < 0) {
      next.unitPrice = "El precio debe ser mayor o igual a 0"
    }

    if (costPrice < 0) {
      next.costPrice = "El costo debe ser mayor o igual a 0"
    }

    if (!isEditing && stock < 0) {
      next.stock = "El stock debe ser mayor o igual a 0"
    }

    if (minStock < 0) {
      next.minStock = "El stock mínimo debe ser mayor o igual a 0"
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEditing
        ? api(`/products/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          })
        : api("/products", {
            method: "POST",
            body: JSON.stringify(data),
          }),
    onSuccess: (data) => {
      const product = data as Product
      navigate(`/inventory/products/${product.id}`)
    },
    onError: (err) => {
      const appErr = err as AppError
      if (appErr.status === 409) {
        // Duplicate code — show inline error
        setErrors((prev) => ({
          ...prev,
          code: "Este código ya está en uso",
        }))
      } else {
        setServerError(appErr.message ?? "Error al guardar el producto")
      }
    },
  })

  // Quick-create category
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (cat) => {
      const category = cat as Category
      setNewCategoryName("")
      setNewCategoryDesc("")
      setCategoryError("")
      setShowCategoryModal(false)
      setCategoryId(category.id)
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (err) => {
      const appErr = err as AppError
      setCategoryError(appErr.message ?? "Error al crear categoría")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    if (!validate()) return

    const data: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      categoryId: categoryId || null,
      unitPrice,
      costPrice,
      minStock,
    }

    if (!isEditing) {
      data.code = code.trim() || null
      data.stock = stock
    }

    mutation.mutate(data)
  }

  if (isEditing && loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/inventory/products")}
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            &larr; Volver a productos
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-800">{serverError}</p>
          </div>
        )}

        <Input
          label="Nombre *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Nombre del producto"
        />

        {!isEditing && (
          <Input
            label="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={errors.code}
            placeholder="Auto-generado si se deja vacío"
          />
        )}

        {isEditing && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Código
            </label>
            <p className="text-sm text-gray-900">{code}</p>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Descripción opcional..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <div className="flex gap-2">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sin categoría</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setNewCategoryName("")
                setNewCategoryDesc("")
                setCategoryError("")
                setShowCategoryModal(true)
              }}
              className="shrink-0 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              title="Crear categoría"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick-create category modal */}
        <Modal
          open={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          title="Nueva Categoría"
        >
          <div className="space-y-4">
            {categoryError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-800">{categoryError}</p>
              </div>
            )}
            <Input
              label="Nombre *"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría"
              autoFocus
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                rows={2}
                placeholder="Descripción opcional..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCategoryModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                loading={createCategoryMutation.isPending}
                onClick={() => {
                  const trimmed = newCategoryName.trim()
                  if (!trimmed) {
                    setCategoryError("El nombre es requerido")
                    return
                  }
                  setCategoryError("")
                  createCategoryMutation.mutate({
                    name: trimmed,
                    description: newCategoryDesc.trim() || undefined,
                  })
                }}
              >
                Crear
              </Button>
            </div>
          </div>
        </Modal>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio Unitario *"
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            error={errors.unitPrice}
          />
          <Input
            label="Costo *"
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(Number(e.target.value))}
            error={errors.costPrice}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {!isEditing
            ? (
              <Input
                label="Stock Inicial"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                error={errors.stock}
              />
            )
            : (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Stock Actual
                </label>
                <p className="text-sm text-gray-900 py-2">
                  {stock}
                  {" — "}
                  <a
                    href={`/inventory/products/${id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ir a producto &rarr; Ajustar stock
                  </a>
                </p>
              </div>
            )}
          <Input
            label="Stock Mínimo"
            type="number"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value))}
            error={errors.minStock}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/inventory/products")}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </div>
      </form>
    </div>
  )
}
