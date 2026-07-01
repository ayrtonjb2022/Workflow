import getPrismaClient from "../../lib/prisma.js"
import type { Prisma } from "@prisma/client"

const prisma = getPrismaClient()

export const auditRepository = {
  async findMany(params: {
    tenantId: string
    entityType?: string
    userId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    const { tenantId, entityType, userId, startDate, endDate, page = 1, limit = 50 } = params
    const where: Prisma.AuditLogWhereInput = { tenantId }

    if (entityType) where.entityType = entityType
    if (userId) where.userId = userId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  },
}
