import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export const usersRepository = {
  async findAll(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    })
  },

  async findById(id: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { id, tenantId },
      include: { roles: { include: { role: true } } },
    })
  },

  async findByEmail(email: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { email, tenantId },
    })
  },

  async create(data: { email: string; name: string; passwordHash: string; tenantId: string; roleIds?: string[] }) {
    const { roleIds, ...userData } = data
    return prisma.user.create({
      data: {
        ...userData,
        active: true,
        roles: roleIds?.length
          ? { create: roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: { roles: { include: { role: true } } },
    })
  },

  async update(id: string, tenantId: string, data: { name?: string; active?: boolean }) {
    return prisma.user.update({
      where: { id, tenantId },
      data,
      include: { roles: { include: { role: true } } },
    })
  },

  async deactivate(id: string, tenantId: string) {
    return prisma.user.update({
      where: { id, tenantId },
      data: { active: false },
    })
  },

  async assignRole(userId: string, roleId: string) {
    return prisma.userRole.create({
      data: { userId, roleId },
    })
  },

  async removeRole(userId: string, roleId: string) {
    return prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    })
  },
}
