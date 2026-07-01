import type { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { authGuard } from "../plugins/auth-guard.js"
import getPrismaClient from "../lib/prisma.js"

const prisma = getPrismaClient()

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // GET /api/settings — get tenant settings
  app.get("/settings", {
    config: { requiredPermission: "settings:read" },
    schema: {},
  }, async (request) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: request.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        taxId: true,
      },
    })
    return tenant
  })

  // PUT /api/settings — update tenant settings
  app.put("/settings", {
    config: { requiredPermission: "settings:update" },
    schema: {
      body: Type.Object({
        name: Type.Optional(Type.String()),
        address: Type.Optional(Type.String()),
        phone: Type.Optional(Type.String()),
        email: Type.Optional(Type.String()),
        taxId: Type.Optional(Type.String()),
        logo: Type.Optional(Type.String()),
      }),
    },
  }, async (request, _reply) => {
    const body = request.body as Record<string, unknown>
    const tenant = await prisma.tenant.update({
      where: { id: request.tenantId },
      data: {
        ...(body.name !== undefined && { name: body.name as string }),
        ...(body.address !== undefined && { address: body.address as string }),
        ...(body.phone !== undefined && { phone: body.phone as string }),
        ...(body.email !== undefined && { email: body.email as string }),
        ...(body.taxId !== undefined && { taxId: body.taxId as string }),
        ...(body.logo !== undefined && { logo: body.logo as string }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        taxId: true,
      },
    })
    return tenant
  })
}
