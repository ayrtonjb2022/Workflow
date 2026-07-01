import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { quotesService } from "../modules/quotes/quotes.service.js"
import { authGuard } from "../plugins/auth-guard.js"
import { generateQuotePdf } from "../lib/pdf-generator.js"
import type { PdfDocData } from "../lib/pdf-generator.js"

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
    return quotesService.create({ ...body, tenantId: request.tenantId }, request.userId)
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
    return quotesService.update(id, request.tenantId, body, request.userId)
  })

  // POST /api/quotes/:id/send — DRAFT→SENT
  app.post("/quotes/:id/send", {
    config: { requiredPermission: "quotes:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.send(id, request.tenantId, request.userId)
  })

  // POST /api/quotes/:id/accept — SENT→ACCEPTED
  app.post("/quotes/:id/accept", {
    config: { requiredPermission: "quotes:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.accept(id, request.tenantId, request.userId)
  })

  // POST /api/quotes/:id/reject — SENT→REJECTED
  app.post("/quotes/:id/reject", {
    config: { requiredPermission: "quotes:update" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.reject(id, request.tenantId, request.userId)
  })

  // POST /api/quotes/:id/convert — create order from accepted quote
  app.post("/quotes/:id/convert", {
    config: { requiredPermission: "quotes:create" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return quotesService.convertToOrder(id, request.tenantId, request.userId)
  })

  // GET /api/quotes/:id/pdf — download PDF
  app.get("/quotes/:id/pdf", {
    config: { requiredPermission: "quotes:read" },
    schema: { params: Type.Object({ id: Type.String() }) },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const quote = await quotesService.get(id, request.tenantId) as Record<string, unknown>

    const data: PdfDocData = {
      title: "Cotización",
      number: quote.number as string,
      date: new Date(quote.date as string).toLocaleDateString("es-AR"),
      customerName: (quote.customer as Record<string, unknown>).name as string,
      customerEmail: ((quote.customer as Record<string, unknown>).email as string) ?? undefined,
      items: (quote.items as Array<Record<string, unknown>>).map((item) => ({
        product: ((item.product as Record<string, unknown>)?.name as string) ?? (item.productId as string),
        quantity: item.quantity as number,
        unitPrice: item.unitPrice as number,
        subtotal: item.subtotal as number,
      })),
      subtotal: quote.subtotal as number,
      tax: quote.tax as number,
      total: quote.total as number,
      notes: (quote.notes as string) ?? undefined,
      status: quote.status as string,
    }

    const pdfBuffer = await generateQuotePdf(data)
    reply.header("Content-Type", "application/pdf")
    reply.header("Content-Disposition", `attachment; filename="${data.number}.pdf"`)
    return reply.send(pdfBuffer)
  })
}
