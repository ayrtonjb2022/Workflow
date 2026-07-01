import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { suppliersService } from "../modules/suppliers/suppliers.service.js"
import type { DocumentType } from "../lib/prisma.js"
import { authGuard } from "../plugins/auth-guard.js"

export async function supplierRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // GET /api/suppliers — list with pagination and search
  app.get("/suppliers", {
    config: { requiredPermission: "suppliers:read" },
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Number()),
        limit: Type.Optional(Type.Number()),
        search: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const query = request.query as { page?: number; limit?: number; search?: string }
    return suppliersService.list(request.tenantId, query.page, query.limit, query.search)
  })

  // GET /api/suppliers/:id — get by id
  app.get("/suppliers/:id", {
    config: { requiredPermission: "suppliers:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return suppliersService.get(id, request.tenantId)
  })

  // POST /api/suppliers — create
  app.post("/suppliers", {
    config: { requiredPermission: "suppliers:create" },
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        email: Type.Optional(Type.String({ format: "email" })),
        phone: Type.Optional(Type.String()),
        documentType: Type.Optional(Type.Union([
          Type.Literal("DNI"),
          Type.Literal("CUIT"),
          Type.Literal("PASSPORT"),
        ])),
        documentNumber: Type.Optional(Type.String()),
        address: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const body = request.body as {
      name: string
      email?: string
      phone?: string
      documentType?: DocumentType
      documentNumber?: string
      address?: string
    }
    return suppliersService.create({ ...body, tenantId: request.tenantId })
  })

  // PATCH /api/suppliers/:id — update
  app.patch("/suppliers/:id", {
    config: { requiredPermission: "suppliers:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        email: Type.Optional(Type.String({ format: "email" })),
        phone: Type.Optional(Type.String()),
        documentType: Type.Optional(Type.Union([
          Type.Literal("DNI"),
          Type.Literal("CUIT"),
          Type.Literal("PASSPORT"),
        ])),
        documentNumber: Type.Optional(Type.String()),
        address: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      name?: string
      email?: string
      phone?: string
      documentType?: DocumentType
      documentNumber?: string
      address?: string
    }
    return suppliersService.update(id, request.tenantId, body)
  })

  // DELETE /api/suppliers/:id — deactivate (soft delete)
  app.delete("/suppliers/:id", {
    config: { requiredPermission: "suppliers:delete" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return suppliersService.deactivate(id, request.tenantId)
  })
}
