import { invoicesRepository } from "./invoices.repository.js"
import { getNextNumber } from "../../lib/numbering.js"
import { fromDecimal, toDecimal } from "../../lib/currency.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

export interface InvoiceItemInput {
  productId: string
  quantity: number
  unitPrice: number
}

export interface CreateInvoiceInput {
  tenantId: string
  branchId?: string
  customerId: string
  date?: string
  notes?: string
  items: InvoiceItemInput[]
}

export interface UpdateInvoiceInput {
  branchId?: string
  customerId?: string
  date?: string
  notes?: string
  items?: InvoiceItemInput[]
}

export interface AddPaymentInput {
  invoiceId: string
  method: string
  amount: number
  reference?: string
}

function calculateTotals(items: InvoiceItemInput[]) {
  const lineItems = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: toDecimal(item.unitPrice),
    subtotal: toDecimal(item.quantity * item.unitPrice),
  }))
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = toDecimal(subtotal * 0.21)
  const total = toDecimal(subtotal + tax)
  return { lineItems, subtotal: toDecimal(subtotal), tax, total }
}

function formatInvoiceResponse(invoice: Record<string, unknown>) {
  return {
    ...invoice,
    subtotal: fromDecimal(invoice.subtotal as unknown as string),
    tax: fromDecimal(invoice.tax as unknown as string),
    total: fromDecimal(invoice.total as unknown as string),
    items: (invoice.items as Array<Record<string, unknown>>)?.map((item) => ({
      ...item,
      unitPrice: fromDecimal(item.unitPrice as unknown as string),
      subtotal: fromDecimal(item.subtotal as unknown as string),
    })),
    payments: (invoice.payments as Array<Record<string, unknown>>)?.map((payment) => ({
      ...payment,
      amount: fromDecimal(payment.amount as unknown as string),
    })),
  }
}

import getPrismaClient from "../../lib/prisma.js"
const prisma = getPrismaClient()

export const invoicesService = {
  async list(tenantId: string, page?: number, limit?: number, search?: string, status?: string) {
    const result = await invoicesRepository.findAll(tenantId, page, limit, search, status)
    return {
      ...result,
      data: result.data.map((i: unknown) => formatInvoiceResponse(i as Record<string, unknown>)),
    }
  },

  async get(id: string, tenantId: string) {
    const invoice = await invoicesRepository.findById(id, tenantId)
    if (!invoice) throw new NotFoundError("Invoice")
    return formatInvoiceResponse(invoice as unknown as Record<string, unknown>)
  },

  async create(data: CreateInvoiceInput) {
    const number = await getNextNumber(data.tenantId, "FAC")
    const { lineItems, subtotal, tax, total } = calculateTotals(data.items)

    const invoice = await invoicesRepository.create(
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

    return formatInvoiceResponse(invoice as unknown as Record<string, unknown>)
  },

  async update(id: string, tenantId: string, data: UpdateInvoiceInput) {
    const existing = await invoicesRepository.findById(id, tenantId)
    if (!existing) throw new NotFoundError("Invoice")
    if (existing.status !== "DRAFT") throw new ValidationError("Only DRAFT invoices can be edited")

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

      const invoice = await invoicesRepository.update(id, tenantId, updateData, lineItems)
      return formatInvoiceResponse(invoice as unknown as Record<string, unknown>)
    }

    const invoice = await invoicesRepository.update(id, tenantId, updateData)
    return formatInvoiceResponse(invoice as unknown as Record<string, unknown>)
  },

  async send(id: string, tenantId: string) {
    const invoice = await invoicesRepository.findById(id, tenantId)
    if (!invoice) throw new NotFoundError("Invoice")
    if (invoice.status !== "DRAFT") throw new ValidationError("Only DRAFT invoices can be sent")
    return invoicesRepository.updateStatus(id, tenantId, "SENT")
  },

  async cancel(id: string, tenantId: string) {
    const invoice = await invoicesRepository.findById(id, tenantId)
    if (!invoice) throw new NotFoundError("Invoice")
    if (invoice.status === "PAID") throw new ValidationError("Cannot cancel a paid invoice")
    return invoicesRepository.updateStatus(id, tenantId, "CANCELLED")
  },

  async addPayment(invoiceId: string, tenantId: string, data: AddPaymentInput) {
    const invoice = await invoicesRepository.findById(invoiceId, tenantId)
    if (!invoice) throw new NotFoundError("Invoice")
    if (invoice.status === "CANCELLED") throw new ValidationError("Cannot add payment to a cancelled invoice")
    if (invoice.status === "PAID") throw new ValidationError("Invoice is already fully paid")

    // Add payment and possibly mark as PAID in a transaction
    return prisma.$transaction(async (tx) => {
      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId,
          method: data.method,
          amount: toDecimal(data.amount),
          reference: data.reference,
        },
      })

      // Check if total payments now equal or exceed invoice total
      const agg = await tx.invoicePayment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      })
      const totalPaid = Number(agg._sum.amount || 0)

      if (totalPaid >= Number(invoice.total)) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID" },
        })
      } else if (invoice.status === "DRAFT") {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: "SENT" },
        })
      }

      return payment
    })
  },
}
