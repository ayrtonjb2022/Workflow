import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export const rolesRepository = {
  async findAll(tenantId: string) {
    return prisma.role.findMany({
      where: { OR: [{ tenantId }, { isSystem: true }] },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    })
  },

  async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    })
  },

  async create(data: { name: string; description?: string; tenantId: string; permissionIds: string[] }) {
    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        tenantId: data.tenantId,
        rolePermissions: {
          create: data.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: { rolePermissions: { include: { permission: true } } },
    })
  },

  async update(id: string, data: { name?: string; description?: string }) {
    return prisma.role.update({
      where: { id },
      data,
      include: { rolePermissions: { include: { permission: true } } },
    })
  },

  async setPermissions(id: string, permissionIds: string[]) {
    await prisma.rolePermission.deleteMany({ where: { roleId: id } })
    return prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
    })
  },

  async findUserRole(userId: string, roleId: string) {
    return prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    })
  },

  async countAdminUsers(tenantId: string): Promise<number> {
    const adminRole = await prisma.role.findFirst({
      where: { name: "admin", isSystem: true },
    })
    if (!adminRole) return 0

    return prisma.userRole.count({
      where: {
        roleId: adminRole.id,
        user: { tenantId, active: true },
      },
    })
  },

  async delete(id: string) {
    return prisma.role.delete({ where: { id } })
  },
}
