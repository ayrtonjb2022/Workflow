import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { rolesService } from "../modules/roles/roles.service.js"

export async function roleRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authGuard)

  // List roles
  app.get("/roles", {
    config: { requiredPermission: "roles:read" },
    schema: {},
  }, async (request) => {
    return rolesService.list(request.tenantId)
  })

  // Get role by id
  app.get("/roles/:id", {
    config: { requiredPermission: "roles:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return rolesService.get(id)
  })

  // Create role
  app.post("/roles", {
    config: { requiredPermission: "roles:create" },
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 2 }),
        description: Type.Optional(Type.String()),
        permissionIds: Type.Array(Type.String()),
      }),
    },
  }, async (request) => {
    const body = request.body as { name: string; description?: string; permissionIds: string[] }
    return rolesService.create({ ...body, tenantId: request.tenantId })
  })

  // Update role
  app.put("/roles/:id", {
    config: { requiredPermission: "roles:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { name?: string; description?: string }
    return rolesService.update(id, body)
  })

  // Delete role
  app.delete("/roles/:id", {
    config: { requiredPermission: "roles:delete" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return rolesService.delete(id)
  })

  // Set role permissions (replace all)
  app.post("/roles/:id/permissions", {
    config: { requiredPermission: "roles:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        permissionIds: Type.Array(Type.String()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { permissionIds: string[] }
    await rolesService.setPermissions(id, body.permissionIds)
    return rolesService.get(id)
  })

  // Assign user to role
  app.post("/roles/:id/users", {
    config: { requiredPermission: "roles:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        userId: Type.String(),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { userId: string }
    return rolesService.assignUser(body.userId, id, request.tenantId)
  })

  // Remove user from role
  app.delete("/roles/:id/users/:userId", {
    config: { requiredPermission: "roles:update" },
    schema: {
      params: Type.Object({ id: Type.String(), userId: Type.String() }),
    },
  }, async (request) => {
    const { id, userId } = request.params as { id: string; userId: string }
    return rolesService.removeUser(userId, id, request.tenantId)
  })
}
