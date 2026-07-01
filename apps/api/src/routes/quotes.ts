import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { quotesService } from "../modules/quotes/quotes.service.js"
import { authGuard } from "../plugins/auth-guard.js"

export async function quoteRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // GET /api/quotes — list with pagination, search, and status filter
  app.get("/quotes", {
    config: { requiredPermission: "quotes:read" },
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Number()),
        limit: Type.Optional(Type.Number()),
        search: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const query = request.query as { page?: number; limit?: number; search?: string; status?: string }
    return quotesService.list(request.tenantId, query.page, query.limit, query.search, query.status)
  })

  // POST /api/quotes — create
  app.post("/quotes", {
    config: { requiredPermission: "quotes:create" },
    schema: {
      body: Type.Object({
        customerId: Type.String(),
        branchId: Type.Optional(Type.String()),
        date: Type.Optional(Type.String()),
        notes: Type.Optional(Type.String()),
        items: Type.Array(Type.Object({
          productId: Type.String(),
          quantity: Type.Number({ minimum: 1 }),
          unitPrice: Type.Number({ minimum: 0 }),
        })),
      }),
    },
  }, async (request) => {
    const body = request.body as { customerId: string; branchId?: string; date?: string; notes?: string; items: Array<{ productId: string; quantity: number; unitPrice: number }> }
    return quotesService.create({ ...body, tenantId: request.tenantId })
  })

  // GET /api/quotes/:id — get by id
  app.get("/quotes/:id", {
    config: { requiredPermission: "quotes:read" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.get(id, request.tenantId)
  })

  // PATCH /api/quotes/:id — update (DRAFT only)
  app.patch("/quotes/:id", {
    config: { requiredPermission: "quotes:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        customerId: Type.Optional(Type.String()),
        branchId: Type.Optional(Type.String()),
        notes: Type.Optional(Type.String()),
        items: Type.Optional(Type.Array(Type.Object({
          productId: Type.String(),
          quantity: Type.Number({ minimum: 1 }),
          unitPrice: Type.Number({ minimum: 0 }),
        }))),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { customerId?: string; branchId?: string; notes?: string; items?: Array<{ productId: string; quantity: number; unitPrice: number }> }
    return quotesService.update(id, request.tenantId, body)
  })

  // POST /api/quotes/:id/send — DRAFT→SENT
  app.post("/quotes/:id/send", {
    config: { requiredPermission: "quotes:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.send(id, request.tenantId)
  })

  // POST /api/quotes/:id/accept — SENT→ACCEPTED
  app.post("/quotes/:id/accept", {
    config: { requiredPermission: "quotes:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.accept(id, request.tenantId)
  })

  // POST /api/quotes/:id/reject — SENT→REJECTED
  app.post("/quotes/:id/reject", {
    config: { requiredPermission: "quotes:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.reject(id, request.tenantId)
  })

  // POST /api/quotes/:id/convert — create order from accepted quote
  app.post("/quotes/:id/convert", {
    config: { requiredPermission: "quotes:create" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.convertToOrder(id, request.tenantId)
  })
}
