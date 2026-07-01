export interface SalesReport {
  totalRevenue: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  cancelledInvoices: number
  averageTicket: number
  byDay: DayRow[]
  byStatus: StatusRow[]
}

export interface DayRow {
  date: string
  count: number
  revenue: number
}

export interface StatusRow {
  status: string
  count: number
  total: number
}

export interface StockReport {
  totalProducts: number
  lowStockCount: number
  products: StockProduct[]
}

export interface StockProduct {
  id: string
  code: string
  name: string
  category: string | null
  stock: number
  minStock: number
  unitPrice: number
  status: "ok" | "low" | "critical"
}
