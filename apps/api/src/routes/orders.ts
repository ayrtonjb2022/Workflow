import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { ordersService } from "../modules/orders/orders.service.js"

export async function orderRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authGuard)

  // GET /api/orders — list with pagination, search, and status filter
  app.get("/orders", {
    config: { requiredPermission: "orders:read" },
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Number()),
        limit: Type.Optional(Type.Number()),
        search: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const { page, limit, search, status } = request.query as any
    return ordersService.list(request.tenantId, page, limit, search, status)
  })

  // POST /api/orders — create
  app.post("/orders", {
    config: { requiredPermission: "orders:create" },
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
    const body = request.body as any
    return ordersService.create({ ...body, tenantId: request.tenantId })
  })

  // GET /api/orders/:id — get by id
  app.get("/orders/:id", {
    config: { requiredPermission: "orders:read" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    return ordersService.get((request.params as any).id, request.tenantId)
  })

  // PATCH /api/orders/:id — update (DRAFT only)
  app.patch("/orders/:id", {
    config: { requiredPermission: "orders:update" },
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
    const { id } = request.params as any
    return ordersService.update(id, request.tenantId, request.body as any)
  })

  // POST /api/orders/:id/send — DRAFT→SENT
  app.post("/orders/:id/send", {
    config: { requiredPermission: "orders:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    return ordersService.send((request.params as any).id, request.tenantId)
  })

  // POST /api/orders/:id/paid — SENT→PAID
  app.post("/orders/:id/paid", {
    config: { requiredPermission: "orders:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    return ordersService.pay((request.params as any).id, request.tenantId)
  })

  // POST /api/orders/:id/cancel — SENT→CANCELLED
  app.post("/orders/:id/cancel", {
    config: { requiredPermission: "orders:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    return ordersService.cancel((request.params as any).id, request.tenantId)
  })
}
