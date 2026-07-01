import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export const warehousesRepository = {
  async findAll(tenantId: string) {
    return prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    })
  },

  async findById(id: string, tenantId: string) {
    return prisma.warehouse.findFirst({
      where: { id, tenantId },
    })
  },

  async findByName(name: string, tenantId: string) {
    return prisma.warehouse.findFirst({
      where: { name, tenantId },
    })
  },

  async create(data: { tenantId: string; name: string; address?: string }) {
    return prisma.warehouse.create({ data })
  },

  async update(id: string, tenantId: string, data: { name?: string; address?: string }) {
    return prisma.warehouse.update({
      where: { id, tenantId },
      data,
    })
  },

  async deactivate(id: string, tenantId: string) {
    return prisma.warehouse.update({
      where: { id, tenantId },
      data: { active: false },
    })
  },
}
