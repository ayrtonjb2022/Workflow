import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { invoicesService } from "../modules/invoices/invoices.service.js"
import { authGuard } from "../plugins/auth-guard.js"

export async function invoiceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // GET /api/invoices — list with pagination, search, and status filter
  app.get("/invoices", {
    config: { requiredPermission: "invoices:read" },
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
    return invoicesService.list(request.tenantId, page, limit, search, status)
  })

  // POST /api/invoices — create
  app.post("/invoices", {
    config: { requiredPermission: "invoices:create" },
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
    return invoicesService.create({ ...body, tenantId: request.tenantId })
  })

  // GET /api/invoices/:id — get by id
  app.get("/invoices/:id", {
    config: { requiredPermission: "invoices:read" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    return invoicesService.get((request.params as any).id, request.tenantId)
  })

  // PATCH /api/invoices/:id — update (DRAFT only)
  app.patch("/invoices/:id", {
    config: { requiredPermission: "invoices:update" },
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
    return invoicesService.update(id, request.tenantId, request.body as any)
  })

  // POST /api/invoices/:id/send — DRAFT→SENT
  app.post("/invoices/:id/send", {
    config: { requiredPermission: "invoices:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    return invoicesService.send((request.params as any).id, request.tenantId)
  })

  // POST /api/invoices/:id/cancel — SENT→CANCELLED
  app.post("/invoices/:id/cancel", {
    config: { requiredPermission: "invoices:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    return invoicesService.cancel((request.params as any).id, request.tenantId)
  })

  // POST /api/invoices/:id/payments — add a payment to an invoice
  app.post("/invoices/:id/payments", {
    config: { requiredPermission: "invoices:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        method: Type.String(),
        amount: Type.Number({ minimum: 0 }),
        reference: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as any
    const body = request.body as any
    return invoicesService.addPayment(id, request.tenantId, {
      invoiceId: id,
      method: body.method,
      amount: body.amount,
      reference: body.reference,
    })
  })
}
