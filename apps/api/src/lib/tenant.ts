import { FastifyRequest } from "fastify"

const TENANT_HEADER = "x-tenant-id"

export function extractTenantId(request: FastifyRequest): string {
  const tenantId = request.headers[TENANT_HEADER] as string | undefined
  if (!tenantId) {
    throw new TenantError("Tenant ID is required")
  }
  return tenantId
}

export class TenantError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TenantError"
  }
}
