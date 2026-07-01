import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

// ── All mocks inside vi.hoisted (runs before imports & before vi.mock factories) ──

const { mockPrisma, mockGetNextNumber } = vi.hoisted(() => {
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
    auditLog: { create: fn(), findMany: fn(), count: fn() },
  }
  const txMock = fn()
  txMock.mockImplementation((cb: (tx: Record<string, any>) => any) => cb(mp))
  mp.$transaction = txMock

  return {
    mockPrisma: mp,
    mockGetNextNumber: vi.fn().mockResolvedValue("FAC-00001"),
  }
})

vi.mock("../../lib/prisma.js", () => ({
  default: () => mockPrisma,
}))

vi.mock("../../lib/numbering.js", () => ({
  getNextNumber: mockGetNextNumber,
}))

// ── SUT ──────────────────────────────────────────────────────────────────────

import { invoicesService } from "./invoices.service.js"

// ── Helpers ──────────────────────────────────────────────────────────────────

const tenantId = "tenant-1"
const makeInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: "inv-1",
  number: "FAC-00001",
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
  payments: [],
  ...overrides,
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe("invoicesService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe("create()", () => {
    it("creates an invoice with auto-generated number and 21% tax", async () => {
      const input = {
        tenantId,
        customerId: "cust-1",
        items: [
          { productId: "prod-1", quantity: 2, unitPrice: 100 },
          { productId: "prod-2", quantity: 1, unitPrice: 50 },
        ],
      }

      mockPrisma.invoice.create.mockResolvedValue(makeInvoice())

      const result = await invoicesService.create(input, "user-1")

      expect(mockGetNextNumber).toHaveBeenCalledWith(tenantId, "FAC")
      expect((result as any).number).toBe("FAC-00001")
      expect(result.subtotal).toBe(250)
      expect(result.tax).toBe(52.5)
      expect(result.total).toBe(302.5)
      expect((result as any).status).toBe("DRAFT")
      expect(result.items).toHaveLength(2)
    })

    it("uses provided date when given", async () => {
      const input = {
        tenantId,
        customerId: "cust-1",
        date: "2025-06-01",
        items: [{ productId: "prod-1", quantity: 1, unitPrice: 100 }],
      }

      mockPrisma.invoice.create.mockResolvedValue(
        makeInvoice({ date: new Date("2025-06-01") }),
      )

      await invoicesService.create(input, "user-1")

      const createCallData = mockPrisma.invoice.create.mock.calls[0][0].data
      expect(createCallData.date).toEqual(new Date("2025-06-01"))
    })
  })

  // ── get ──────────────────────────────────────────────────────────────────

  describe("get()", () => {
    it("returns formatted invoice when found", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice())

      const result = await invoicesService.get("inv-1", tenantId)
      expect((result as any).id).toBe("inv-1")
      expect(result.subtotal).toBe(250)
    })

    it("throws NotFoundError when not found", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null)

      await expect(invoicesService.get("inv-404", tenantId)).rejects.toThrow(NotFoundError)
    })
  })

  // ── list ─────────────────────────────────────────────────────────────────

  describe("list()", () => {
    it("returns paginated results", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([makeInvoice()])
      mockPrisma.invoice.count.mockResolvedValue(1)

      const result = await invoicesService.list(tenantId, 1, 20)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it("forwards search and status filters to repository", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.invoice.count.mockResolvedValue(0)

      await invoicesService.list(tenantId, 1, 20, "FAC", "DRAFT")

      expect(mockPrisma.invoice.findMany).toHaveBeenCalled()
      const where = mockPrisma.invoice.findMany.mock.calls[0][0].where
      expect(where.status).toBe("DRAFT")
    })
  })

  // ── send ─────────────────────────────────────────────────────────────────

  describe("send()", () => {
    it("transitions DRAFT → SENT", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "DRAFT" }))
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: "SENT" }))

      await invoicesService.send("inv-1", tenantId)
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1", tenantId },
          data: { status: "SENT" },
        }),
      )
    })

    it("rejects non-DRAFT invoices", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "SENT" }))

      await expect(invoicesService.send("inv-1", tenantId)).rejects.toThrow(ValidationError)
    })
  })

  // ── cancel ───────────────────────────────────────────────────────────────

  describe("cancel()", () => {
    it("transitions SENT → CANCELLED", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "SENT" }))
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: "CANCELLED" }))

      await invoicesService.cancel("inv-1", tenantId, "user-1")
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1", tenantId },
          data: { status: "CANCELLED" },
        }),
      )
    })

    it("transitions DRAFT → CANCELLED (not explicitly blocked, only PAID is blocked)", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "DRAFT" }))
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: "CANCELLED" }))

      await invoicesService.cancel("inv-1", tenantId, "user-1")
      expect(mockPrisma.invoice.update).toHaveBeenCalled()
    })

    it("rejects PAID invoices", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "PAID" }))

      await expect(invoicesService.cancel("inv-1", tenantId, "user-1")).rejects.toThrow(ValidationError)
    })

    it("throws NotFoundError for missing invoice", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null)

      await expect(invoicesService.cancel("inv-404", tenantId, "user-1")).rejects.toThrow(NotFoundError)
    })
  })

  // ── update ───────────────────────────────────────────────────────────────

  describe("update()", () => {
    it("updates DRAFT invoice fields", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "DRAFT" }))
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ notes: "updated" }))

      const result = await invoicesService.update("inv-1", tenantId, { notes: "updated" }, "user-1")
      expect((result as any).notes).toBe("updated")
    })

    it("rejects update on non-DRAFT invoice", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "SENT" }))

      await expect(
        invoicesService.update("inv-1", tenantId, { notes: "nope" }, "user-1"),
      ).rejects.toThrow(ValidationError)
    })
  })

  // ── addPayment ───────────────────────────────────────────────────────────

  describe("addPayment()", () => {
    beforeEach(() => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "DRAFT" }))
    })

    it("adds a payment and transitions DRAFT → SENT when partially paid", async () => {
      mockPrisma.invoicePayment.create.mockResolvedValue({ id: "pay-1", amount: 50 })
      mockPrisma.invoicePayment.aggregate.mockResolvedValue({ _sum: { amount: 50 } })

      await invoicesService.addPayment("inv-1", tenantId, {
        invoiceId: "inv-1",
        method: "cash",
        amount: 50,
      }, "user-1")

      expect(mockPrisma.invoicePayment.create).toHaveBeenCalled()
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: { status: "SENT" },
        }),
      )
    })

    it("marks invoice as PAID when fully paid", async () => {
      mockPrisma.invoicePayment.create.mockResolvedValue({ id: "pay-1", amount: 302.5 })
      mockPrisma.invoicePayment.aggregate.mockResolvedValue({ _sum: { amount: 302.5 } })

      await invoicesService.addPayment("inv-1", tenantId, {
        invoiceId: "inv-1",
        method: "bank",
        amount: 302.5,
      }, "user-1")

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: { status: "PAID" },
        }),
      )
    })

    it("rejects payment on CANCELLED invoices", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "CANCELLED" }))

      await expect(
        invoicesService.addPayment("inv-1", tenantId, {
          invoiceId: "inv-1",
          method: "cash",
          amount: 50,
        }, "user-1"),
      ).rejects.toThrow(ValidationError)
    })

    it("rejects payment on already PAID invoices", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "PAID" }))

      await expect(
        invoicesService.addPayment("inv-1", tenantId, {
          invoiceId: "inv-1",
          method: "cash",
          amount: 50,
        }, "user-1"),
      ).rejects.toThrow(ValidationError)
    })

    it("rejects payment on missing invoice", async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null)

      await expect(
        invoicesService.addPayment("inv-404", tenantId, {
          invoiceId: "inv-404",
          method: "cash",
          amount: 50,
        }, "user-1"),
      ).rejects.toThrow(NotFoundError)
    })
  })
})
