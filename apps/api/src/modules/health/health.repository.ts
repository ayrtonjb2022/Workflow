import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export const healthRepository = {
  async ping(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  },
}
