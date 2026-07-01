import type { FastifyInstance } from "fastify"
import { authGuard } from "../plugins/auth-guard.js"
import { auditRepository } from "../modules/audit/audit.repository.js"

export async function auditRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  app.get("/audit-logs", {
    config: { requiredPermission: "audit:read" },
  }, async (request) => {
    const { entityType, userId, startDate, endDate, page, limit } = request.query as Record<string, string | undefined>
    const result = await auditRepository.findMany({
      tenantId: request.tenantId,
      entityType,
      userId,
      startDate,
      endDate,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })
    return result
  })
}
