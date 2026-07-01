export interface Customer {
  id: string
  tenantId: string
  branchId: string | null
  name: string
  email: string | null
  phone: string | null
  documentType: string
  documentNumber: string
  address: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  tenantId: string
  customerId: string
  name: string
  email: string | null
  phone: string | null
  position: string | null
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
