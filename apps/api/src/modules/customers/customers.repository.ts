import getPrismaClient, { type DocumentType } from "../../lib/prisma.js"

const prisma = getPrismaClient()

export interface CustomerCreateData {
  tenantId: string
  branchId?: string
  name: string
  email?: string
  phone?: string
  documentType: DocumentType
  documentNumber: string
  address?: string
}

export interface CustomerUpdateData {
  name?: string
  email?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
  address?: string
  branchId?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export const customersRepository = {
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
      prisma.customer.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { branch: { select: { id: true, name: true } } },
      }),
      prisma.customer.count({ where: where as never }),
    ])

    return { data, total, page, limit }
  },

  async findById(id: string, tenantId: string) {
    return prisma.customer.findFirst({
      where: { id, tenantId },
      include: { branch: { select: { id: true, name: true } } },
    })
  },

  async findByEmail(email: string, tenantId: string) {
    return prisma.customer.findFirst({
      where: { email, tenantId },
    })
  },

  async findByDocument(tenantId: string, documentType: DocumentType, documentNumber: string) {
    return prisma.customer.findFirst({
      where: { tenantId, documentType, documentNumber },
    })
  },

  async create(data: CustomerCreateData) {
    return prisma.customer.create({ data })
  },

  async update(id: string, tenantId: string, data: CustomerUpdateData) {
    return prisma.customer.update({
      where: { id, tenantId },
      data,
    })
  },

  async deactivate(id: string, tenantId: string) {
    return prisma.customer.update({
      where: { id, tenantId },
      data: { active: false },
    })
  },
}
