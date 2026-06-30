import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { usersService } from "../modules/users/users.service.js"

export async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authGuard)

  app.get("/users", {
    config: { requiredPermission: "users:read" },
    schema: {},
  }, async (request) => {
    return usersService.list(request.tenantId)
  })

  app.get("/users/:id", {
    config: { requiredPermission: "users:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return usersService.get(id, request.tenantId)
  })

  app.post("/users", {
    config: { requiredPermission: "users:create" },
    schema: {
      body: Type.Object({
        email: Type.String({ format: "email" }),
        password: Type.String({ minLength: 8 }),
        name: Type.String({ minLength: 2 }),
      }),
    },
  }, async (request) => {
    const body = request.body as { email: string; password: string; name: string }
    return usersService.create({ ...body, tenantId: request.tenantId })
  })

  app.patch("/users/:id", {
    config: { requiredPermission: "users:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        active: Type.Optional(Type.Boolean()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { name?: string; active?: boolean }
    return usersService.update(id, request.tenantId, body)
  })

  app.delete("/users/:id", {
    config: { requiredPermission: "users:delete" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return usersService.deactivate(id, request.tenantId)
  })
}
