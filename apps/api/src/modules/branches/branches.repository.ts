import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export const branchesRepository = {
  async findAll(tenantId: string) {
    return prisma.branch.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    })
  },

  async findById(id: string, tenantId: string) {
    return prisma.branch.findFirst({
      where: { id, tenantId },
    })
  },

  async findByName(name: string, tenantId: string) {
    return prisma.branch.findFirst({
      where: { name, tenantId },
    })
  },

  async create(data: { tenantId: string; name: string; address?: string; phone?: string }) {
    return prisma.branch.create({ data })
  },

  async update(id: string, tenantId: string, data: { name?: string; address?: string; phone?: string }) {
    return prisma.branch.update({
      where: { id, tenantId },
      data,
    })
  },

  async deactivate(id: string, tenantId: string) {
    return prisma.branch.update({
      where: { id, tenantId },
      data: { active: false },
    })
  },
}
