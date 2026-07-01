export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"
export type OrderStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED"
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED"

export interface CustomerSummary {
  id: string
  name: string
  email: string | null
  phone?: string | null
}

export interface ProductSummary {
  id: string
  name: string
  code: string
}

export interface QuoteItem {
  id: string
  productId: string
  product?: ProductSummary
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Quote {
  id: string
  tenantId: string
  number: string
  date: string
  status: QuoteStatus
  subtotal: number
  tax: number
  total: number
  notes: string | null
  customerId: string
  customer: CustomerSummary
  items: QuoteItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productId: string
  product?: ProductSummary
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: string
  tenantId: string
  number: string
  date: string
  status: OrderStatus
  subtotal: number
  tax: number
  total: number
  notes: string | null
  sourceQuoteId: string | null
  customerId: string
  customer: CustomerSummary
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  productId: string
  product?: ProductSummary
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface InvoicePayment {
  id: string
  invoiceId: string
  method: string
  amount: number
  reference: string | null
  createdAt: string
}

export interface Invoice {
  id: string
  tenantId: string
  number: string
  date: string
  status: InvoiceStatus
  subtotal: number
  tax: number
  total: number
  notes: string | null
  paidAmount: number
  customerId: string
  customer: CustomerSummary
  items: InvoiceItem[]
  payments: InvoicePayment[]
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
