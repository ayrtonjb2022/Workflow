import { suppliersRepository } from "./suppliers.repository.js"
import type { DocumentType } from "../../lib/prisma.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"
import { auditLogger } from "../../lib/audit-logger.js"

export interface CreateSupplierInput {
  tenantId: string
  name: string
  email?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
  address?: string
}

export interface UpdateSupplierInput {
  name?: string
  email?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
  address?: string
}

export const suppliersService = {
  async list(tenantId: string, page?: number, limit?: number, search?: string) {
    return suppliersRepository.findAll(tenantId, page, limit, search)
  },

  async get(id: string, tenantId: string) {
    const supplier = await suppliersRepository.findById(id, tenantId)
    if (!supplier) throw new NotFoundError("Supplier")
    return supplier
  },

  async create(data: CreateSupplierInput, userId: string) {
    // Check duplicate document number within tenant
    if (data.documentNumber) {
      const existing = await suppliersRepository.findByDocumentNumber(data.tenantId, data.documentNumber)
      if (existing) throw new ValidationError("A supplier with this document number already exists in this tenant")
    }

    const supplier = await suppliersRepository.create(data)

    await auditLogger.log({
      tenantId: data.tenantId,
      userId,
      entityType: "Supplier",
      entityId: supplier.id,
      action: "CREATE",
      after: supplier,
    })

    return supplier
  },

  async update(id: string, tenantId: string, data: UpdateSupplierInput, userId: string) {
    const supplier = await suppliersRepository.findById(id, tenantId)
    if (!supplier) throw new NotFoundError("Supplier")
    const updated = await suppliersRepository.update(id, tenantId, data)

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Supplier",
      entityId: id,
      action: "UPDATE",
      before: supplier,
      after: updated,
    })

    return updated
  },

  async deactivate(id: string, tenantId: string, userId: string) {
    const supplier = await suppliersRepository.findById(id, tenantId)
    if (!supplier) throw new NotFoundError("Supplier")

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Supplier",
      entityId: id,
      action: "DELETE",
      before: supplier,
      after: null,
    })

    return suppliersRepository.deactivate(id, tenantId)
  },
}
