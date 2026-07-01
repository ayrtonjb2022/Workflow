import { quotesRepository } from "./quotes.repository.js"
import { getNextNumber } from "../../lib/numbering.js"
import { fromDecimal, toDecimal } from "../../lib/currency.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"
import { auditLogger } from "../../lib/audit-logger.js"

export interface QuoteItemInput {
  productId: string
  quantity: number
  unitPrice: number
}

export interface CreateQuoteInput {
  tenantId: string
  branchId?: string
  customerId: string
  date?: string
  notes?: string
  items: QuoteItemInput[]
}

export interface UpdateQuoteInput {
  branchId?: string
  customerId?: string
  date?: string
  notes?: string
  items?: QuoteItemInput[]
}

function calculateTotals(items: QuoteItemInput[]) {
  const lineItems = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: toDecimal(item.unitPrice),
    subtotal: toDecimal(item.quantity * item.unitPrice),
  }))
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = toDecimal(subtotal * 0.21) // 21% IVA
  const total = toDecimal(subtotal + tax)
  return { lineItems, subtotal: toDecimal(subtotal), tax, total }
}

function formatQuoteResponse(quote: Record<string, unknown>) {
  return {
    ...quote,
    subtotal: fromDecimal(quote.subtotal as unknown as string),
    tax: fromDecimal(quote.tax as unknown as string),
    total: fromDecimal(quote.total as unknown as string),
    items: (quote.items as Array<Record<string, unknown>>)?.map((item) => ({
      ...item,
      unitPrice: fromDecimal(item.unitPrice as unknown as string),
      subtotal: fromDecimal(item.subtotal as unknown as string),
    })),
  }
}

import getPrismaClient from "../../lib/prisma.js"
const prisma = getPrismaClient()

export const quotesService = {
  async list(tenantId: string, page?: number, limit?: number, search?: string, status?: string) {
    const result = await quotesRepository.findAll(tenantId, page, limit, search, status)
    return {
      ...result,
      data: result.data.map((q: unknown) => formatQuoteResponse(q as Record<string, unknown>)),
    }
  },

  async get(id: string, tenantId: string) {
    const quote = await quotesRepository.findById(id, tenantId)
    if (!quote) throw new NotFoundError("Quote")
    return formatQuoteResponse(quote as unknown as Record<string, unknown>)
  },

  async create(data: CreateQuoteInput, userId: string) {
    const number = await getNextNumber(data.tenantId, "COT")
    const { lineItems, subtotal, tax, total } = calculateTotals(data.items)

    const quote = await quotesRepository.create(
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

    await auditLogger.log({
      tenantId: data.tenantId,
      userId,
      entityType: "Quote",
      entityId: quote.id,
      action: "CREATE",
      after: quote,
    })

    return formatQuoteResponse(quote as unknown as Record<string, unknown>)
  },

  async update(id: string, tenantId: string, data: UpdateQuoteInput, userId: string) {
    const existing = await quotesRepository.findById(id, tenantId)
    if (!existing) throw new NotFoundError("Quote")
    if (existing.status !== "DRAFT") throw new ValidationError("Only DRAFT quotes can be edited")

    const updateData: Record<string, unknown> = {}
    if (data.branchId !== undefined) updateData.branchId = data.branchId
    if (data.customerId !== undefined) updateData.customerId = data.customerId
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.date) updateData.date = new Date(data.date)

    let quote: unknown
    if (data.items) {
      const { lineItems, subtotal, tax, total } = calculateTotals(data.items)
      updateData.subtotal = subtotal
      updateData.tax = tax
      updateData.total = total

      quote = await quotesRepository.update(id, tenantId, updateData, lineItems)
    } else {
      quote = await quotesRepository.update(id, tenantId, updateData)
    }

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Quote",
      entityId: id,
      action: "UPDATE",
      before: existing,
      after: quote,
    })

    return formatQuoteResponse(quote as unknown as Record<string, unknown>)
  },

  async send(id: string, tenantId: string, userId: string) {
    const quote = await quotesRepository.findById(id, tenantId)
    if (!quote) throw new NotFoundError("Quote")
    if (quote.status !== "DRAFT") throw new ValidationError("Only DRAFT quotes can be sent")
    const updated = await quotesRepository.updateStatus(id, tenantId, "SENT")

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Quote",
      entityId: id,
      action: "SEND",
      before: quote,
      after: updated,
    })

    return updated
  },

  async accept(id: string, tenantId: string, userId: string) {
    const quote = await quotesRepository.findById(id, tenantId)
    if (!quote) throw new NotFoundError("Quote")
    if (quote.status !== "SENT") throw new ValidationError("Only SENT quotes can be accepted")
    const updated = await quotesRepository.updateStatus(id, tenantId, "ACCEPTED")

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Quote",
      entityId: id,
      action: "ACCEPT",
      before: quote,
      after: updated,
    })

    return updated
  },

  async reject(id: string, tenantId: string, userId: string) {
    const quote = await quotesRepository.findById(id, tenantId)
    if (!quote) throw new NotFoundError("Quote")
    if (quote.status !== "SENT") throw new ValidationError("Only SENT quotes can be rejected")
    const updated = await quotesRepository.updateStatus(id, tenantId, "REJECTED")

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Quote",
      entityId: id,
      action: "REJECT",
      before: quote,
      after: updated,
    })

    return updated
  },

  async convertToOrder(id: string, tenantId: string, userId: string) {
    const quote = await quotesRepository.findById(id, tenantId)
    if (!quote) throw new NotFoundError("Quote")
    if (quote.status !== "ACCEPTED") throw new ValidationError("Only ACCEPTED quotes can be converted to orders")

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

    const orderNumber = await getNextNumber(tenantId, "PED")

    // Calculate totals from copied quote items
    const lineItems = quoteData.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: toDecimal(Number(item.unitPrice)),
      subtotal: toDecimal(Number(item.subtotal)),
    }))
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
    const tax = toDecimal(subtotal * 0.21)
    const total = toDecimal(subtotal + tax)

    return prisma.$transaction(async (tx) => {
      const updatedQuote = await tx.quote.update({
        where: { id, tenantId },
        data: { status: "ACCEPTED" },
      })

      const order = await tx.order.create({
        data: {
          tenantId: quoteData.tenantId,
          branchId: quoteData.branchId,
          customerId: quoteData.customerId,
          number: orderNumber,
          status: "DRAFT",
          subtotal: toDecimal(subtotal),
          tax,
          total,
          notes: quoteData.notes,
          sourceQuoteId: id,
          items: { create: lineItems },
        } as never,
      })

      await auditLogger.log({
        tenantId,
        userId,
        entityType: "Quote",
        entityId: id,
        action: "CONVERT",
        before: quote,
        after: updatedQuote,
        tx,
      })

      await auditLogger.log({
        tenantId,
        userId,
        entityType: "Order",
        entityId: order.id,
        action: "CREATE",
        after: order,
        tx,
      })

      return order
    })
  },
}
