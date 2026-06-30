import { PrismaClient } from "@prisma/client"
export type { DocumentType } from "@prisma/client"

let prisma: PrismaClient

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

export interface TenantScopedPrisma {
  // Return a proxy or wrapper that scopes all queries to tenantId
  // For now, return the raw client — tenant scoping middleware will be added
  client: PrismaClient
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createTenantScopedClient(_tenantId: string): TenantScopedPrisma {
  return {
    client: getPrismaClient(),
  }
}

export default getPrismaClient
