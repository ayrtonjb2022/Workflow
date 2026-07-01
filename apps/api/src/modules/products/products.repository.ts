import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

import type { Prisma } from "@prisma/client"

export interface ProductCreateData {
  tenantId: string
  code: string
  name: string
  description?: string
  categoryId?: string
  unitPrice: number
  costPrice: number
  stock?: number
  minStock?: number
}

export interface ProductUpdateData {
  name?: string
  description?: string
  categoryId?: string
  unitPrice?: number
  costPrice?: number
  minStock?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export const productsRepository = {
  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    categoryId?: string,
    active?: boolean,
  ): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ]
    }

    if (categoryId !== undefined) {
      where.categoryId = categoryId
    }

    // Default to active=true unless explicit
    if (active !== undefined) {
      where.active = active
    } else {
      where.active = true
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where: where as never }),
    ])

    return { data, total, page, limit }
  },

  async findById(id: string, tenantId: string) {
    return prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: { select: { id: true, name: true } } },
    })
  },

  async findByCode(code: string, tenantId: string) {
    return prisma.product.findFirst({
      where: { code, tenantId },
    })
  },

  async findCategoryById(id: string, tenantId: string) {
    return prisma.category.findFirst({
      where: { id, tenantId },
    })
  },

  async create(data: ProductCreateData) {
    const isDev = process.env.NODE_ENV !== "production"
    if (isDev) {
      console.log("[products.repository] create data:", JSON.stringify({ ...data, tenantId: "[REDACTED]" }))
    }

    const createData: Record<string, unknown> = {
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      description: data.description,
      unitPrice: data.unitPrice,
      costPrice: data.costPrice,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 0,
    }

    // Only set categoryId if it's a non-null string — omit otherwise to avoid FK issues
    if (data.categoryId) {
      createData.categoryId = data.categoryId
    }

    return prisma.product.create({
      data: createData as Prisma.ProductCreateInput,
      include: { category: { select: { id: true, name: true } } },
    })
  },

  async update(id: string, tenantId: string, data: ProductUpdateData) {
    return prisma.product.update({
      where: { id, tenantId },
      data,
      include: { category: { select: { id: true, name: true } } },
    })
  },

  async deactivate(id: string, tenantId: string) {
    return prisma.product.update({
      where: { id, tenantId },
      data: { active: false },
      include: { category: { select: { id: true, name: true } } },
    })
  },

  // ── Categories ──────────────────────────────────────────────

  async findAllCategories(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
    })
  },

  async findCategoryByName(name: string, tenantId: string) {
    return prisma.category.findFirst({
      where: { name, tenantId },
    })
  },

  async createCategory(data: { tenantId: string; name: string; description?: string }) {
    return prisma.category.create({ data })
  },

  async updateCategory(id: string, tenantId: string, data: { name?: string; description?: string }) {
    return prisma.category.update({
      where: { id, tenantId },
      data,
    })
  },

  // ── Stock Adjustment ────────────────────────────────────────

  async adjustStockInTransaction(
    tx: Prisma.TransactionClient,
    id: string,
    tenantId: string,
    newStock: number,
  ) {
    return tx.product.update({
      where: { id, tenantId },
      data: { stock: newStock },
      include: { category: { select: { id: true, name: true } } },
    })
  },
}
