import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export const quotesRepository = {
  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string,
  ): Promise<PaginatedResult<unknown>> {
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = { tenantId }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ]
    }
    if (status) where.status = status

    const [data, total] = await Promise.all([
      prisma.quote.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          customer: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.quote.count({ where: where as never }),
    ])
    return { data, total, page, limit }
  },

  async findById(id: string, tenantId: string) {
    return prisma.quote.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, code: true } } },
        },
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
  },

  async create(data: Record<string, unknown>, items: Array<Record<string, unknown>>) {
    return prisma.quote.create({
      data: {
        ...data,
        items: { create: items },
      } as never,
    })
  },

  async update(id: string, tenantId: string, data: Record<string, unknown>, items?: Array<Record<string, unknown>>) {
    if (items) {
      return prisma.$transaction(async (tx) => {
        await tx.quoteItem.deleteMany({ where: { quoteId: id } })
        return tx.quote.update({
          where: { id, tenantId },
          data: { ...data, items: { create: items } } as never,
        })
      })
    }
    return prisma.quote.update({ where: { id, tenantId }, data: data as never })
  },

  async updateStatus(id: string, tenantId: string, status: string) {
    return prisma.quote.update({
      where: { id, tenantId },
      data: { status: status as never },
    })
  },
}
