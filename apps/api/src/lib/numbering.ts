import getPrismaClient from "./prisma.js"

const prisma = getPrismaClient()

export async function getNextNumber(tenantId: string, prefix: string): Promise<string> {
  // Prisma upsert is atomic under the hood — acts as SELECT … FOR UPDATE equivalent
  const seq = await prisma.documentSequence.upsert({
    where: { tenantId_prefix: { tenantId, prefix } },
    create: { tenantId, prefix, counter: 1 },
    update: { counter: { increment: 1 } },
  })
  return `${prefix}-${String(seq.counter).padStart(5, "0")}`
}
