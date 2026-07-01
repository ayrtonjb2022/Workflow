export interface Product {
  id: string
  code: string
  name: string
  description: string | null
  categoryId: string | null
  category: { id: string; name: string } | null
  unitPrice: number
  costPrice: number
  stock: number
  minStock: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  active: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateProductInput {
  name: string
  code?: string
  categoryId?: string
  unitPrice: number
  costPrice: number
  stock?: number
  description?: string
  minStock?: number
}

export interface UpdateProductInput {
  name?: string
  categoryId?: string
  unitPrice?: number
  costPrice?: number
  description?: string
  minStock?: number
}

export interface AdjustStockInput {
  quantity: number
  reason?: string
}
