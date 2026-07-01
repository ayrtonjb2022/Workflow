import { productsRepository } from "./products.repository.js"
import getPrismaClient from "../../lib/prisma.js"
import { getNextNumber } from "../../lib/numbering.js"
import { toDecimal } from "../../lib/currency.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

const prisma = getPrismaClient()

export const productsService = {
  async list(
    tenantId: string,
    page?: number,
    limit?: number,
    search?: string,
    categoryId?: string,
    active?: boolean,
  ) {
    return productsRepository.findAll(tenantId, page, limit, search, categoryId, active)
  },

  async get(id: string, tenantId: string) {
    const product = await productsRepository.findById(id, tenantId)
    if (!product) throw new NotFoundError("Product")
    return product
  },

  async create(data: {
    tenantId: string
    name: string
    code?: string
    categoryId?: string
    unitPrice: number
    costPrice: number
    stock?: number
    description?: string
    minStock?: number
  }) {
    // Validate category exists if provided
    if (data.categoryId) {
      const category = await productsRepository.findCategoryById(data.categoryId, data.tenantId)
      if (!category) {
        throw new ValidationError("Category not found in this tenant")
      }
    }

    // Resolve code: use provided, or auto-generate
    let code = data.code?.trim() ?? ""

    if (!code) {
      code = await getNextNumber(data.tenantId, "PRO")
    } else {
      // Check if code is already taken
      const existing = await productsRepository.findByCode(code, data.tenantId)
      if (existing) {
        // Auto-generate new code to avoid conflict
        code = await getNextNumber(data.tenantId, "PRO")
      }
    }

    const unitPrice = toDecimal(data.unitPrice)
    const costPrice = toDecimal(data.costPrice)

    return productsRepository.create({
      ...data,
      code,
      unitPrice,
      costPrice,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 0,
    })
  },

  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string
      categoryId?: string
      unitPrice?: number
      costPrice?: number
      description?: string
      minStock?: number
    },
  ) {
    const product = await productsRepository.findById(id, tenantId)
    if (!product) throw new NotFoundError("Product")

    // Validate category exists if provided
    if (data.categoryId) {
      const category = await productsRepository.findCategoryById(data.categoryId, tenantId)
      if (!category) {
        throw new ValidationError("Category not found in this tenant")
      }
    }

    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.unitPrice !== undefined) updateData.unitPrice = toDecimal(data.unitPrice)
    if (data.costPrice !== undefined) updateData.costPrice = toDecimal(data.costPrice)
    if (data.minStock !== undefined) updateData.minStock = data.minStock

    // Never update code or stock via this endpoint
    return productsRepository.update(id, tenantId, updateData)
  },

  async deactivate(id: string, tenantId: string) {
    const product = await productsRepository.findById(id, tenantId)
    if (!product) throw new NotFoundError("Product")
    return productsRepository.deactivate(id, tenantId)
  },

  async adjustStock(
    id: string,
    tenantId: string,
    quantity: number,
    reason?: string,
  ) {
    if (quantity === 0) {
      throw new ValidationError("Quantity must be non-zero")
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id, tenantId },
      })

      if (!product) {
        throw new NotFoundError("Product")
      }

      if (!product.active) {
        throw new ValidationError("Cannot adjust stock of a deactivated product")
      }

      const newStock = product.stock + quantity

      if (newStock < 0) {
        throw new ValidationError(
          `Insufficient stock. Current: ${product.stock}, requested change: ${quantity}`,
        )
      }

      // Update product stock
      const updated = await productsRepository.adjustStockInTransaction(
        tx,
        id,
        tenantId,
        newStock,
      )

      // Create StockMovement record
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: id,
          warehouseId: null,
          type: "ADJUSTMENT" as any,
          quantity: Math.abs(quantity),
          reference: reason ?? null,
        },
      })

      return updated
    })
  },
}
