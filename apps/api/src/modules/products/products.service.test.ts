import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

// ── All mocks inside vi.hoisted ─────────────────────────────────────────────

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
    mockGetNextNumber: vi.fn().mockResolvedValue("PRO-00001"),
  }
})

vi.mock("../../lib/prisma.js", () => ({
  default: () => mockPrisma,
}))

vi.mock("../../lib/numbering.js", () => ({
  getNextNumber: mockGetNextNumber,
}))

// ── SUT ──────────────────────────────────────────────────────────────────────

import { productsService } from "./products.service.js"

// ── Helpers ──────────────────────────────────────────────────────────────────

const tenantId = "tenant-1"

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  id: "prod-1",
  code: "PRO-00001",
  name: "Test Product",
  description: null,
  categoryId: null,
  category: null,
  unitPrice: 100,
  costPrice: 60,
  stock: 10,
  minStock: 2,
  active: true,
  tenantId,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe("productsService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("create()", () => {
    it("creates a product with auto-generated code (PRO-xxxxx)", async () => {
      mockPrisma.product.create.mockResolvedValue(makeProduct())

      const result = await productsService.create({
        tenantId,
        name: "New Product",
        unitPrice: 100,
        costPrice: 60,
      }, "user-1")

      expect(mockGetNextNumber).toHaveBeenCalledWith(tenantId, "PRO")
      expect(result.code).toBe("PRO-00001")
      expect(result.name).toBe("Test Product")
    })

    it("uses provided code when given", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)
      mockPrisma.product.create.mockResolvedValue(makeProduct({ code: "CUSTOM-001" }))

      const result = await productsService.create({
        tenantId,
        name: "Custom Code Product",
        code: "CUSTOM-001",
        unitPrice: 100,
        costPrice: 60,
      }, "user-1")

      expect(result.code).toBe("CUSTOM-001")
    })

    it("auto-generates when provided code is taken", async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: "existing", code: "TAKEN", tenantId })
      mockPrisma.product.create.mockResolvedValue(makeProduct({ code: "PRO-00001" }))

      const result = await productsService.create({
        tenantId,
        name: "Product with taken code",
        code: "TAKEN",
        unitPrice: 100,
        costPrice: 60,
      }, "user-1")

      expect(result.code).toBe("PRO-00001")
    })

    it("validates category existence when categoryId is provided", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null)

      await expect(
        productsService.create({
          tenantId,
          name: "Product",
          categoryId: "cat-404",
          unitPrice: 100,
          costPrice: 60,
        }, "user-1"),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe("get()", () => {
    it("returns product when found", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct())
      const result = await productsService.get("prod-1", tenantId)
      expect(result.id).toBe("prod-1")
    })

    it("throws NotFoundError when missing", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)
      await expect(productsService.get("prod-404", tenantId)).rejects.toThrow(NotFoundError)
    })
  })

  describe("list()", () => {
    it("returns paginated products", async () => {
      mockPrisma.product.findMany.mockResolvedValue([makeProduct()])
      mockPrisma.product.count.mockResolvedValue(1)
      const result = await productsService.list(tenantId)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  describe("adjustStock()", () => {
    it("increases stock (IN adjustment)", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct({ stock: 10 }))
      mockPrisma.product.update.mockResolvedValue(makeProduct({ stock: 15 }))
      mockPrisma.stockMovement.create.mockResolvedValue({})

      await productsService.adjustStock("prod-1", tenantId, 5, "restock")

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "prod-1", tenantId }, data: { stock: 15 } }),
      )
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId, productId: "prod-1", type: "ADJUSTMENT", quantity: 5, reference: "restock",
          }),
        }),
      )
    })

    it("decreases stock (OUT adjustment)", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct({ stock: 10 }))
      mockPrisma.product.update.mockResolvedValue(makeProduct({ stock: 7 }))
      mockPrisma.stockMovement.create.mockResolvedValue({})

      await productsService.adjustStock("prod-1", tenantId, -3, "sale")

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { stock: 7 } }),
      )
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ quantity: 3 }) }),
      )
    })

    it("rejects adjustment below zero stock", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct({ stock: 5 }))
      await expect(
        productsService.adjustStock("prod-1", tenantId, -10, "oops"),
      ).rejects.toThrow(ValidationError)
    })

    it("rejects zero quantity adjustment", async () => {
      await expect(
        productsService.adjustStock("prod-1", tenantId, 0, "no-op"),
      ).rejects.toThrow(ValidationError)
    })

    it("rejects adjustment on deactivated product", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct({ active: false, stock: 10 }))
      await expect(
        productsService.adjustStock("prod-1", tenantId, 5),
      ).rejects.toThrow(ValidationError)
    })

    it("throws NotFoundError when product does not exist", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)
      await expect(
        productsService.adjustStock("prod-404", tenantId, 5),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe("update()", () => {
    it("updates product fields", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct())
      mockPrisma.product.update.mockResolvedValue(makeProduct({ name: "Updated" }))

      const result = await productsService.update("prod-1", tenantId, { name: "Updated" }, "user-1")
      expect(result.name).toBe("Updated")
    })

    it("throws NotFoundError when missing", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)
      await expect(
        productsService.update("prod-404", tenantId, { name: "Nope" }, "user-1"),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe("deactivate()", () => {
    it("deactivates an active product", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(makeProduct())
      mockPrisma.product.update.mockResolvedValue(makeProduct({ active: false }))

      const result = await productsService.deactivate("prod-1", tenantId, "user-1")
      expect(result.active).toBe(false)
    })

    it("throws NotFoundError when missing", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)
      await expect(productsService.deactivate("prod-404", tenantId, "user-1")).rejects.toThrow(NotFoundError)
    })
  })
})
