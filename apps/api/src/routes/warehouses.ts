import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { warehousesService } from "../modules/warehouses/warehouses.service.js"
import { authGuard } from "../plugins/auth-guard.js"

export async function warehouseRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // GET /api/warehouses — list all
  app.get("/warehouses", {
    config: { requiredPermission: "settings:read" },
  }, async (request) => {
    return warehousesService.list(request.tenantId)
  })

  // GET /api/warehouses/:id — get by id
  app.get("/warehouses/:id", {
    config: { requiredPermission: "settings:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return warehousesService.get(id, request.tenantId)
  })

  // POST /api/warehouses — create
  app.post("/warehouses", {
    config: { requiredPermission: "settings:create" },
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        address: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const body = request.body as { name: string; address?: string }
    return warehousesService.create({
      tenantId: request.tenantId,
      name: body.name,
      address: body.address,
    }, request.userId)
  })

  // PATCH /api/warehouses/:id — update
  app.patch("/warehouses/:id", {
    config: { requiredPermission: "settings:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        address: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { name?: string; address?: string }
    return warehousesService.update(id, request.tenantId, body, request.userId)
  })

  // DELETE /api/warehouses/:id — deactivate
  app.delete("/warehouses/:id", {
    config: { requiredPermission: "settings:delete" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return warehousesService.deactivate(id, request.tenantId, request.userId)
  })
}
