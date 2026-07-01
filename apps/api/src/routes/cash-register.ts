import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { cashRegisterService } from "../modules/cash-register/cash-register.service.js"
import { authGuard } from "../plugins/auth-guard.js"

export async function cashRegisterRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // GET /api/cash-registers — list all active registers for tenant
  app.get("/cash-registers", {
    config: { requiredPermission: "cash:read" },
  }, async (request) => {
    return cashRegisterService.list(request.tenantId)
  })

  // GET /api/cash-registers/:id — detail with movements
  app.get("/cash-registers/:id", {
    config: { requiredPermission: "cash:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return cashRegisterService.get(id, request.tenantId)
  })

  // POST /api/cash-registers — create
  app.post("/cash-registers", {
    config: { requiredPermission: "cash:create" },
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        branchId: Type.Optional(Type.String()),
      }),
    },
  }, async (request, reply) => {
    const body = request.body as { name: string; branchId?: string }
    const register = await cashRegisterService.create({
      tenantId: request.tenantId,
      name: body.name,
      branchId: body.branchId,
    })
    return reply.status(201).send(register)
  })

  // POST /api/cash-registers/:id/open — open register
  app.post("/cash-registers/:id/open", {
    config: { requiredPermission: "cash:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return cashRegisterService.openRegister(id, request.tenantId)
  })

  // POST /api/cash-registers/:id/close — close register
  app.post("/cash-registers/:id/close", {
    config: { requiredPermission: "cash:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return cashRegisterService.closeRegister(id, request.tenantId)
  })

  // POST /api/cash-registers/:id/movements — add movement
  app.post("/cash-registers/:id/movements", {
    config: { requiredPermission: "cash:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        type: Type.Union([Type.Literal("IN"), Type.Literal("OUT")]),
        amount: Type.Number({ exclusiveMinimum: 0 }),
        description: Type.Optional(Type.String()),
        reference: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      type: "IN" | "OUT"
      amount: number
      description?: string
      reference?: string
    }
    return cashRegisterService.addMovement(
      id,
      request.tenantId,
      body.type,
      body.amount,
      body.description,
      body.reference,
    )
  })
}
