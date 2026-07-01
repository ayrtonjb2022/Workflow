export interface Branch {
  id: string
  tenantId: string
  name: string
  address: string | null
  phone: string | null
  active: boolean
  createdAt: string
}

export interface Warehouse {
  id: string
  tenantId: string
  name: string
  address: string | null
  active: boolean
  createdAt: string
}
