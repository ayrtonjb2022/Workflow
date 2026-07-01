export interface Supplier {
  id: string
  tenantId: string
  name: string
  email: string | null
  phone: string | null
  documentType: string | null
  documentNumber: string | null
  address: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
