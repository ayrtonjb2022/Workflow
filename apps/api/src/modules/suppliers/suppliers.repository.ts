import getPrismaClient, { type DocumentType } from "../../lib/prisma.js"

const prisma = getPrismaClient()

export interface SupplierCreateData {
  tenantId: string
  name: string
  email?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
  address?: string
}

export interface SupplierUpdateData {
  name?: string
  email?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
  address?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export const suppliersRepository = {
  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { documentNumber: { contains: search, mode: "insensitive" } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.supplier.count({ where: where as never }),
    ])

    return { data, total, page, limit }
  },

  async findById(id: string, tenantId: string) {
    return prisma.supplier.findFirst({
      where: { id, tenantId },
    })
  },

  async findByDocumentNumber(tenantId: string, documentNumber: string) {
    return prisma.supplier.findFirst({
      where: { tenantId, documentNumber },
    })
  },

  async create(data: SupplierCreateData) {
    return prisma.supplier.create({ data })
  },

  async update(id: string, tenantId: string, data: SupplierUpdateData) {
    return prisma.supplier.update({
      where: { id, tenantId },
      data,
    })
  },

  async deactivate(id: string, tenantId: string) {
    return prisma.supplier.update({
      where: { id, tenantId },
      data: { active: false },
    })
  },
}
