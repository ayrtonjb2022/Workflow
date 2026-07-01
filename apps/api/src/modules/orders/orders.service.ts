import { ordersRepository } from "./orders.repository.js"
import { getNextNumber } from "../../lib/numbering.js"
import { fromDecimal, toDecimal } from "../../lib/currency.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

export interface OrderItemInput {
  productId: string
  quantity: number
  unitPrice: number
}

export interface CreateOrderInput {
  tenantId: string
  branchId?: string
  customerId: string
  date?: string
  notes?: string
  items: OrderItemInput[]
}

export interface UpdateOrderInput {
  branchId?: string
  customerId?: string
  date?: string
  notes?: string
  items?: OrderItemInput[]
}

function calculateTotals(items: OrderItemInput[]) {
  const lineItems = items.map((item) => ({
    ...item,
    unitPrice: toDecimal(item.unitPrice),
    subtotal: toDecimal(item.quantity * item.unitPrice),
  }))
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = toDecimal(subtotal * 0.21)
  const total = toDecimal(subtotal + tax)
  return { lineItems, subtotal: toDecimal(subtotal), tax, total }
}

function formatOrderResponse(order: Record<string, unknown>) {
  return {
    ...order,
    subtotal: fromDecimal(order.subtotal as unknown as string),
    tax: fromDecimal(order.tax as unknown as string),
    total: fromDecimal(order.total as unknown as string),
    items: (order.items as Array<Record<string, unknown>>)?.map((item) => ({
      ...item,
      unitPrice: fromDecimal(item.unitPrice as unknown as string),
      subtotal: fromDecimal(item.subtotal as unknown as string),
    })),
  }
}

export const ordersService = {
  async list(tenantId: string, page?: number, limit?: number, search?: string, status?: string) {
    return ordersRepository.findAll(tenantId, page, limit, search, status)
  },

  async get(id: string, tenantId: string) {
    const order = await ordersRepository.findById(id, tenantId)
    if (!order) throw new NotFoundError("Order")
    return formatOrderResponse(order as unknown as Record<string, unknown>)
  },

  async create(data: CreateOrderInput) {
    const number = await getNextNumber(data.tenantId, "PED")
    const { lineItems, subtotal, tax, total } = calculateTotals(data.items)

    const order = await ordersRepository.create(
      {
        tenantId: data.tenantId,
        branchId: data.branchId,
        customerId: data.customerId,
        number,
        date: data.date ? new Date(data.date) : new Date(),
        status: "DRAFT",
        subtotal,
        tax,
        total,
        notes: data.notes,
      },
      lineItems,
    )

    return formatOrderResponse(order as unknown as Record<string, unknown>)
  },

  async createFromQuote(quote: Record<string, unknown>, tenantId: string) {
    // This method is called from quotesService.convertToOrder
    // The quote is already validated as ACCEPTED
    const number = await getNextNumber(tenantId, "PED")

    const quoteData = quote as unknown as {
      tenantId: string
      branchId?: string | null
      customerId: string
      notes?: string | null
      items: Array<{
        productId: string
        quantity: number
        unitPrice: unknown
        subtotal: unknown
      }>
    }

    const lineItems = quoteData.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: toDecimal(Number(item.unitPrice)),
      subtotal: toDecimal(Number(item.subtotal)),
    }))
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
    const tax = toDecimal(subtotal * 0.21)
    const total = toDecimal(subtotal + tax)

    const order = await ordersRepository.create(
      {
        tenantId: quoteData.tenantId,
        branchId: quoteData.branchId,
        customerId: quoteData.customerId,
        number,
        status: "DRAFT",
        subtotal,
        tax,
        total,
        notes: quoteData.notes,
      },
      lineItems,
    )

    return formatOrderResponse(order as unknown as Record<string, unknown>)
  },

  async update(id: string, tenantId: string, data: UpdateOrderInput) {
    const existing = await ordersRepository.findById(id, tenantId)
    if (!existing) throw new NotFoundError("Order")
    if (existing.status !== "DRAFT") throw new ValidationError("Only DRAFT orders can be edited")

    const updateData: Record<string, unknown> = {}
    if (data.branchId !== undefined) updateData.branchId = data.branchId
    if (data.customerId !== undefined) updateData.customerId = data.customerId
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.date) updateData.date = new Date(data.date)

    if (data.items) {
      const { lineItems, subtotal, tax, total } = calculateTotals(data.items)
      updateData.subtotal = subtotal
      updateData.tax = tax
      updateData.total = total

      const order = await ordersRepository.update(id, tenantId, updateData, lineItems)
      return formatOrderResponse(order as unknown as Record<string, unknown>)
    }

    const order = await ordersRepository.update(id, tenantId, updateData)
    return formatOrderResponse(order as unknown as Record<string, unknown>)
  },

  async send(id: string, tenantId: string) {
    const order = await ordersRepository.findById(id, tenantId)
    if (!order) throw new NotFoundError("Order")
    if (order.status !== "DRAFT") throw new ValidationError("Only DRAFT orders can be sent")
    return ordersRepository.updateStatus(id, tenantId, "SENT")
  },

  async pay(id: string, tenantId: string) {
    const order = await ordersRepository.findById(id, tenantId)
    if (!order) throw new NotFoundError("Order")
    if (order.status !== "SENT") throw new ValidationError("Only SENT orders can be marked as paid")
    return ordersRepository.updateStatus(id, tenantId, "PAID")
  },

  async cancel(id: string, tenantId: string) {
    const order = await ordersRepository.findById(id, tenantId)
    if (!order) throw new NotFoundError("Order")
    if (order.status === "PAID") throw new ValidationError("Cannot cancel a paid order")
    return ordersRepository.updateStatus(id, tenantId, "CANCELLED")
  },
}
