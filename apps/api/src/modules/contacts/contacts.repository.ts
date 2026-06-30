import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export interface ContactCreateData {
  tenantId: string
  customerId: string
  name: string
  email?: string
  phone?: string
  position?: string
}

export const contactsRepository = {
  async findByCustomer(customerId: string, tenantId: string) {
    return prisma.contact.findMany({
      where: { customerId, tenantId },
      orderBy: { createdAt: "desc" },
    })
  },

  async findByIdWithCustomer(id: string, customerId: string, tenantId: string) {
    return prisma.contact.findFirst({
      where: { id, customerId, tenantId },
    })
  },

  async create(data: ContactCreateData) {
    return prisma.contact.create({ data })
  },

  async hardDelete(id: string, customerId: string, tenantId: string) {
    return prisma.contact.delete({
      where: { id, customerId, tenantId },
    })
  },
}
