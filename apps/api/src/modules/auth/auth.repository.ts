import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  async createUser(data: { email: string; name: string; passwordHash: string; tenantId: string }) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        tenantId: data.tenantId,
        active: true,
      },
    })
  },

  async createTenant(name: string, slug: string) {
    return prisma.tenant.create({
      data: { name, slug },
    })
  },

  async createUserWithAdminRole(data: {
    email: string
    name: string
    passwordHash: string
    tenant: { id: string; name: string; slug: string }
  }) {
    const adminRole = await prisma.role.findFirst({
      where: { name: "admin", isSystem: true },
    })

    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        tenantId: data.tenant.id,
        active: true,
        roles: {
          create: { roleId: adminRole!.id },
        },
      },
    })
  },

  async saveRefreshToken(data: { token: string; userId: string; tenantId: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data })
  },

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({ where: { token } })
  },

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  },

  async revokeUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  },
}
