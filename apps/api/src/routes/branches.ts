import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { branchesService } from "../modules/branches/branches.service.js"
import { authGuard } from "../plugins/auth-guard.js"

export async function branchRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // GET /api/branches — list all
  app.get("/branches", {
    config: { requiredPermission: "settings:read" },
  }, async (request) => {
    return branchesService.list(request.tenantId)
  })

  // GET /api/branches/:id — get by id
  app.get("/branches/:id", {
    config: { requiredPermission: "settings:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return branchesService.get(id, request.tenantId)
  })

  // POST /api/branches — create
  app.post("/branches", {
    config: { requiredPermission: "settings:create" },
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        address: Type.Optional(Type.String()),
        phone: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const body = request.body as { name: string; address?: string; phone?: string }
    return branchesService.create({
      tenantId: request.tenantId,
      name: body.name,
      address: body.address,
      phone: body.phone,
    })
  })

  // PATCH /api/branches/:id — update
  app.patch("/branches/:id", {
    config: { requiredPermission: "settings:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        address: Type.Optional(Type.String()),
        phone: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { name?: string; address?: string; phone?: string }
    return branchesService.update(id, request.tenantId, body)
  })

  // DELETE /api/branches/:id — deactivate
  app.delete("/branches/:id", {
    config: { requiredPermission: "settings:delete" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return branchesService.deactivate(id, request.tenantId)
  })
}
