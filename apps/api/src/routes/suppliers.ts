import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { suppliersService } from "../modules/suppliers/suppliers.service.js"
import { exportToExcel, parseExcel, validateSupplierRow, type ExcelRow } from "../lib/excel.js"
import type { DocumentType } from "../lib/prisma.js"
import { suppliersRepository } from "../modules/suppliers/suppliers.repository.js"
import { ValidationError } from "../lib/errors.js"

export async function supplierRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authGuard)

  // ── Suppliers ──────────────────────────────────────────────

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

  // GET /api/suppliers/export — export to Excel (BEFORE /:id)
  app.get("/suppliers/export", {
    config: { requiredPermission: "suppliers:read" },
    schema: {},
  }, async (request, reply) => {
    const result = await suppliersRepository.findAll(request.tenantId, 1, 10_000)
    const headers = ["name", "email", "phone", "documentType", "documentNumber", "address"]
    const buffer = exportToExcel(result.data as ExcelRow[], headers, "Suppliers")

    reply.header("Content-Disposition", "attachment; filename=suppliers.xlsx")
    reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    return reply.send(buffer)
  })

  // POST /api/suppliers/import — import from Excel (BEFORE /:id)
  app.post("/suppliers/import", {
    config: { requiredPermission: "suppliers:create" },
    schema: {},
  }, async (request) => {
    const file = await request.file()
    if (!file) {
      throw new ValidationError("Excel file is required")
    }

    const buffer = await file.toBuffer()
    const rows = parseExcel(buffer)

    // Gather existing emails and docs for duplicate detection
    const result = await suppliersRepository.findAll(request.tenantId, 1, 10_000)
    const existingEmails = new Set(
      (result.data as Array<{ email?: string | null }>)
        .map((s) => s.email?.toLowerCase())
        .filter((e): e is string => !!e),
    )
    const existingDocs = new Set(
      (result.data as Array<{ documentType?: string | null; documentNumber?: string | null }>)
        .filter((s) => s.documentType && s.documentNumber)
        .map((s) => `${s.documentType}:${s.documentNumber}`),
    )

    let imported = 0
    let skipped = 0
    const errors: Array<{ row: number; field: string; reason: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowErrors = validateSupplierRow(row, i + 1, existingEmails, existingDocs)

      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
        skipped++
        continue
      }

      try {
        await suppliersRepository.create({
          tenantId: request.tenantId,
          name: String(row.name).trim(),
          email: row.email ? String(row.email).trim().toLowerCase() : undefined,
          phone: row.phone ? String(row.phone).trim() : undefined,
          documentType: row.documentType ? String(row.documentType).trim().toUpperCase() as DocumentType : undefined,
          documentNumber: row.documentNumber ? String(row.documentNumber).trim() : undefined,
          address: row.address ? String(row.address).trim() : undefined,
        })
        imported++
      } catch {
        errors.push({ row: i + 1, field: "general", reason: "Failed to create supplier" })
        skipped++
      }
    }

    return { imported, skipped, errors }
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
