import { FastifyRequest } from "fastify"
import { authService } from "../modules/auth/auth.service.js"

export class TenantError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TenantError"
  }
}

export interface TenantContext {
  tenantId: string
  userId: string
}

export async function extractTenantId(request: FastifyRequest): Promise<TenantContext> {
  const token = request.cookies?.access_token
  if (!token) {
    throw new TenantError("Authentication required")
  }

  try {
    const payload = await authService.verifyAccessToken(token)
    return { tenantId: payload.tenantId, userId: payload.userId }
  } catch {
    throw new TenantError("Invalid or expired token")
  }
}
