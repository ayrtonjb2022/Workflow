import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export const magicLinkRepository = {
  async saveToken(data: { token: string; userId: string; tenantId: string; expiresAt: Date }) {
    return prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        tenantId: data.tenantId,
        expiresAt: data.expiresAt,
      },
    })
  },

  async findToken(token: string) {
    return prisma.refreshToken.findUnique({ where: { token } })
  },

  async revokeToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  },
}
