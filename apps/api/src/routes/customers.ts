import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { customersService } from "../modules/customers/customers.service.js"
import { contactsService } from "../modules/contacts/contacts.service.js"
import { exportToExcel, parseExcel, validateCustomerRow, type ExcelRow } from "../lib/excel.js"
import type { DocumentType } from "../lib/prisma.js"
import { customersRepository } from "../modules/customers/customers.repository.js"
import { ValidationError } from "../lib/errors.js"
import { authGuard } from "../plugins/auth-guard.js"

export async function customerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // ── Customers ───────────────────────────────────────────────

  // GET /api/customers — list with pagination and search
  app.get("/customers", {
    config: { requiredPermission: "customers:read" },
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Number()),
        limit: Type.Optional(Type.Number()),
        search: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const query = request.query as { page?: number; limit?: number; search?: string }
    return customersService.list(request.tenantId, query.page, query.limit, query.search)
  })

  // GET /api/customers/export — export to Excel (BEFORE /:id)
  app.get("/customers/export", {
    config: { requiredPermission: "customers:read" },
    schema: {},
  }, async (request, reply) => {
    const result = await customersRepository.findAll(request.tenantId, 1, 10_000)
    const headers = ["name", "email", "phone", "documentType", "documentNumber", "address"]
    const buffer = exportToExcel(result.data as ExcelRow[], headers, "Customers")

    reply.header("Content-Disposition", "attachment; filename=customers.xlsx")
    reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    return reply.send(buffer)
  })

  // POST /api/customers/import — import from Excel (BEFORE /:id)
  app.post("/customers/import", {
    config: { requiredPermission: "customers:create" },
    schema: {},
  }, async (request) => {
    const file = await request.file()
    if (!file) {
      throw new ValidationError("Excel file is required")
    }

    const buffer = await file.toBuffer()
    const rows = parseExcel(buffer)

    // Gather existing emails and docs for duplicate detection
    const result = await customersRepository.findAll(request.tenantId, 1, 10_000)
    const existingEmails = new Set(
      (result.data as Array<{ email?: string | null }>)
        .map((c) => c.email?.toLowerCase())
        .filter((e): e is string => !!e),
    )
    const existingDocs = new Set(
      (result.data as Array<{ documentType?: string | null; documentNumber?: string | null }>)
        .filter((c) => c.documentType && c.documentNumber)
        .map((c) => `${c.documentType}:${c.documentNumber}`),
    )

    let imported = 0
    let skipped = 0
    const errors: Array<{ row: number; field: string; reason: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowErrors = validateCustomerRow(row, i + 1, existingEmails, existingDocs)

      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
        skipped++
        continue
      }

      if (!row.documentType || !row.documentNumber) {
        errors.push({ row: i + 1, field: "document", reason: "documentType and documentNumber are required" })
        skipped++
        continue
      }

      try {
        await customersRepository.create({
          tenantId: request.tenantId,
          name: String(row.name).trim(),
          email: row.email ? String(row.email).trim().toLowerCase() : undefined,
          phone: row.phone ? String(row.phone).trim() : undefined,
          documentType: String(row.documentType).trim().toUpperCase() as DocumentType,
          documentNumber: String(row.documentNumber).trim(),
          address: row.address ? String(row.address).trim() : undefined,
        })
        imported++
      } catch {
        errors.push({ row: i + 1, field: "general", reason: "Failed to create customer" })
        skipped++
      }
    }

    return { imported, skipped, errors }
  })

  // GET /api/customers/:id — get by id
  app.get("/customers/:id", {
    config: { requiredPermission: "customers:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return customersService.get(id, request.tenantId)
  })

  // POST /api/customers — create
  app.post("/customers", {
    config: { requiredPermission: "customers:create" },
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        email: Type.Optional(Type.String({ format: "email" })),
        phone: Type.Optional(Type.String()),
        branchId: Type.Optional(Type.String()),
        documentType: Type.Union([
          Type.Literal("DNI"),
          Type.Literal("CUIT"),
          Type.Literal("PASSPORT"),
        ]),
        documentNumber: Type.String(),
        address: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const body = request.body as {
      name: string
      email?: string
      phone?: string
      branchId?: string
      documentType: DocumentType
      documentNumber: string
      address?: string
    }
    return customersService.create({ ...body, tenantId: request.tenantId }, request.userId)
  })

  // PATCH /api/customers/:id — update
  app.patch("/customers/:id", {
    config: { requiredPermission: "customers:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        email: Type.Optional(Type.String({ format: "email" })),
        phone: Type.Optional(Type.String()),
        branchId: Type.Optional(Type.String()),
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
      branchId?: string
      documentType?: DocumentType
      documentNumber?: string
      address?: string
    }
    return customersService.update(id, request.tenantId, body, request.userId)
  })

  // DELETE /api/customers/:id — deactivate (soft delete)
  app.delete("/customers/:id", {
    config: { requiredPermission: "customers:delete" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return customersService.deactivate(id, request.tenantId, request.userId)
  })

  // ── Contacts (nested under customers) ───────────────────────

  // GET /api/customers/:id/contacts — list contacts
  app.get("/customers/:id/contacts", {
    config: { requiredPermission: "customers:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return contactsService.list(id, request.tenantId)
  })

  // POST /api/customers/:id/contacts — create contact
  app.post("/customers/:id/contacts", {
    config: { requiredPermission: "customers:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        email: Type.Optional(Type.String({ format: "email" })),
        phone: Type.Optional(Type.String()),
        position: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      name: string
      email?: string
      phone?: string
      position?: string
    }
    return contactsService.create({
      ...body,
      customerId: id,
      tenantId: request.tenantId,
    }, request.userId)
  })

  // GET /api/customers/:id/contacts/:contactId — get contact
  app.get("/customers/:id/contacts/:contactId", {
    config: { requiredPermission: "customers:read" },
    schema: {
      params: Type.Object({
        id: Type.String(),
        contactId: Type.String(),
      }),
    },
  }, async (request) => {
    const { id, contactId } = request.params as { id: string; contactId: string }
    return contactsService.get(contactId, id, request.tenantId)
  })

  // DELETE /api/customers/:id/contacts/:contactId — delete contact
  app.delete("/customers/:id/contacts/:contactId", {
    config: { requiredPermission: "customers:update" },
    schema: {
      params: Type.Object({
        id: Type.String(),
        contactId: Type.String(),
      }),
    },
  }, async (request) => {
    const { id, contactId } = request.params as { id: string; contactId: string }
    return contactsService.delete(contactId, id, request.tenantId, request.userId)
  })
}
