import getPrismaClient from "./prisma.js"
import type { Prisma } from "@prisma/client"

const prisma = getPrismaClient()

export type EntityType =
  | "Quote"
  | "Order"
  | "Invoice"
  | "Customer"
  | "Contact"
  | "Supplier"
  | "Product"
  | "Category"
  | "User"
  | "Role"
  | "Branch"
  | "Warehouse"
  | "CashRegister"

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SEND"
  | "CANCEL"
  | "ACCEPT"
  | "REJECT"
  | "PAY"
  | "OPEN"
  | "CLOSE"
  | "IN"
  | "OUT"
  | "ADJUSTMENT"
  | "CONVERT"

// Fields to NEVER log in before/after (sensitive data)
const SENSITIVE_FIELDS = new Set(["passwordHash", "refreshToken", "refreshTokens"])

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== "object") return data
  if (Array.isArray(data)) return data.map(sanitize)
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.has(key)) continue
    sanitized[key] = value
  }
  return sanitized
}

export const auditLogger = {
  async log(params: {
    tenantId: string
    userId: string
    entityType: EntityType
    entityId: string
    action: AuditAction
    before?: unknown
    after?: unknown
    tx?: Prisma.TransactionClient
  }): Promise<void> {
    const { tenantId, userId, entityType, entityId, action, before, after, tx } = params

    const data = {
      tenantId,
      userId,
      entityType,
      entityId,
      action,
      before: before ? (sanitize(before) as Prisma.JsonObject) : undefined,
      after: after ? (sanitize(after) as Prisma.JsonObject) : undefined,
    }

    if (tx) {
      await tx.auditLog.create({ data })
    } else {
      await prisma.auditLog.create({ data })
    }
  },
}
