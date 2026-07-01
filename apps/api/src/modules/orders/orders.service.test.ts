import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

// ── All mocks inside vi.hoisted ─────────────────────────────────────────────

const { mockPrisma, mockGetNextNumber, mockInvoiceCreate } = vi.hoisted(() => {
  const fn = () => vi.fn()
  const mp: Record<string, any> = {
    invoice: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    order: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    quote: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    product: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    category: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
    customer: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    supplier: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    branch: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
    warehouse: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
    cashRegister: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
    cashMovement: { findFirst: fn(), findMany: fn(), create: fn() },
    invoicePayment: { create: fn(), aggregate: fn(), findMany: fn() },
    invoiceItem: { deleteMany: fn() },
    stockMovement: { create: fn() },
    user: { findFirst: fn(), findMany: fn(), create: fn(), update: fn(), findUnique: fn() },
    role: { findFirst: fn(), findMany: fn(), create: fn(), update: fn(), delete: fn(), findUnique: fn() },
    permission: { findMany: fn() },
    userRole: { findUnique: fn(), create: fn(), delete: fn(), count: fn() },
    rolePermission: { deleteMany: fn(), createMany: fn() },
    documentSequence: { findUnique: fn(), update: fn() },
    refreshToken: { findFirst: fn(), create: fn(), update: fn() },
  }
  const txMock = fn()
  txMock.mockImplementation((cb: (tx: Record<string, any>) => any) => cb(mp))
  mp.$transaction = txMock

  return {
    mockPrisma: mp,
    mockGetNextNumber: vi.fn().mockResolvedValue("PED-00001"),
    mockInvoiceCreate: vi.fn().mockResolvedValue({ id: "inv-auto-1", number: "FAC-00001", status: "DRAFT" }),
  }
})

vi.mock("../../lib/prisma.js", () => ({
  default: () => mockPrisma,
}))

vi.mock("../../lib/numbering.js", () => ({
  getNextNumber: mockGetNextNumber,
}))

vi.mock("../invoices/invoices.service.js", () => ({
  invoicesService: { create: mockInvoiceCreate },
}))

// ── SUT ──────────────────────────────────────────────────────────────────────

import { ordersService } from "./orders.service.js"

// ── Helpers ──────────────────────────────────────────────────────────────────

const tenantId = "tenant-1"

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: "ord-1",
  number: "PED-00001",
  tenantId,
  customerId: "cust-1",
  status: "DRAFT",
  date: new Date("2025-01-15"),
  subtotal: "250.00",
  tax: "52.50",
  total: "302.50",
  notes: null,
  items: [
    { id: "item-1", productId: "prod-1", quantity: 2, unitPrice: "100.00", subtotal: "200.00" },
    { id: "item-2", productId: "prod-2", quantity: 1, unitPrice: "50.00", subtotal: "50.00" },
  ],
  customer: { id: "cust-1", name: "Test Customer", email: "test@example.com" },
  sourceQuote: null,
  ...overrides,
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ordersService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("create()", () => {
    it("creates an order with auto-generated number PED-xxxxx", async () => {
      const input = {
        tenantId,
        customerId: "cust-1",
        items: [{ productId: "prod-1", quantity: 2, unitPrice: 100 }],
      }
      mockPrisma.order.create.mockResolvedValue(makeOrder())

      const result = await ordersService.create(input)

      expect(mockGetNextNumber).toHaveBeenCalledWith(tenantId, "PED")
      expect(result.number).toBe("PED-00001")
      expect(result.status).toBe("DRAFT")
      expect(result.subtotal).toBe(250)
      expect(result.tax).toBe(52.5)
      expect(result.total).toBe(302.5)
    })
  })

  describe("get()", () => {
    it("returns formatted order when found", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder())
      const result = await ordersService.get("ord-1", tenantId)
      expect(result.id).toBe("ord-1")
    })

    it("throws NotFoundError when not found", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null)
      await expect(ordersService.get("ord-404", tenantId)).rejects.toThrow(NotFoundError)
    })
  })

  describe("list()", () => {
    it("returns paginated results", async () => {
      mockPrisma.order.findMany.mockResolvedValue([makeOrder()])
      mockPrisma.order.count.mockResolvedValue(1)

      const result = await ordersService.list(tenantId, 1, 20)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  describe("send()", () => {
    it("transitions DRAFT → SENT", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder({ status: "DRAFT" }))
      mockPrisma.order.update.mockResolvedValue(makeOrder({ status: "SENT" }))

      await ordersService.send("ord-1", tenantId)
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "ord-1", tenantId }, data: { status: "SENT" } }),
      )
    })

    it("rejects non-DRAFT orders", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder({ status: "SENT" }))
      await expect(ordersService.send("ord-1", tenantId)).rejects.toThrow(ValidationError)
    })
  })

  describe("pay()", () => {
    it("transitions SENT → PAID and auto-creates invoice", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder({ status: "SENT" }))
      mockPrisma.order.update.mockResolvedValue(makeOrder({ status: "PAID" }))

      const result = await ordersService.pay("ord-1", tenantId)

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "ord-1", tenantId }, data: { status: "PAID" } }),
      )
      expect(mockInvoiceCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          customerId: "cust-1",
          items: expect.arrayContaining([expect.objectContaining({ productId: "prod-1" })]),
        }),
      )
      expect(result).toHaveProperty("order")
      expect(result).toHaveProperty("invoice")
    })

    it("rejects pay on non-SENT orders", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder({ status: "DRAFT" }))
      await expect(ordersService.pay("ord-1", tenantId)).rejects.toThrow(ValidationError)
    })
  })

  describe("cancel()", () => {
    it("cancels SENT order", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder({ status: "SENT" }))
      mockPrisma.order.update.mockResolvedValue(makeOrder({ status: "CANCELLED" }))

      await ordersService.cancel("ord-1", tenantId)
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "CANCELLED" } }),
      )
    })

    it("rejects cancel on PAID order", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder({ status: "PAID" }))
      await expect(ordersService.cancel("ord-1", tenantId)).rejects.toThrow(ValidationError)
    })

    it("throws NotFoundError for missing order", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null)
      await expect(ordersService.cancel("ord-404", tenantId)).rejects.toThrow(NotFoundError)
    })
  })

  describe("createFromQuote()", () => {
    it("creates an order from an accepted quote", async () => {
      const quote = {
        id: "qt-1",
        number: "COT-00001",
        tenantId,
        branchId: null,
        customerId: "cust-1",
        notes: "from quote",
        status: "ACCEPTED",
        items: [{ productId: "prod-1", quantity: 1, unitPrice: "200.00", subtotal: "200.00" }],
      }
      mockPrisma.order.create.mockResolvedValue(makeOrder())

      const result = await ordersService.createFromQuote(quote, tenantId)
      expect(mockGetNextNumber).toHaveBeenCalledWith(tenantId, "PED")
      expect(result.number).toBe("PED-00001")
      expect(result.status).toBe("DRAFT")
    })
  })

  describe("update()", () => {
    it("updates DRAFT order fields", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder({ status: "DRAFT" }))
      mockPrisma.order.update.mockResolvedValue(makeOrder({ notes: "updated" }))

      const result = await ordersService.update("ord-1", tenantId, { notes: "updated" })
      expect(result.notes).toBe("updated")
    })

    it("rejects update on non-DRAFT order", async () => {
      mockPrisma.order.findFirst.mockResolvedValue(makeOrder({ status: "SENT" }))
      await expect(
        ordersService.update("ord-1", tenantId, { notes: "nope" }),
      ).rejects.toThrow(ValidationError)
    })
  })
})
