import { suppliersRepository } from "./suppliers.repository.js"
import type { DocumentType } from "../../lib/prisma.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

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

  async create(data: CreateSupplierInput) {
    // Check duplicate document number within tenant
    if (data.documentNumber) {
      const existing = await suppliersRepository.findByDocumentNumber(data.tenantId, data.documentNumber)
      if (existing) throw new ValidationError("A supplier with this document number already exists in this tenant")
    }

    return suppliersRepository.create(data)
  },

  async update(id: string, tenantId: string, data: UpdateSupplierInput) {
    const supplier = await suppliersRepository.findById(id, tenantId)
    if (!supplier) throw new NotFoundError("Supplier")
    return suppliersRepository.update(id, tenantId, data)
  },

  async deactivate(id: string, tenantId: string) {
    const supplier = await suppliersRepository.findById(id, tenantId)
    if (!supplier) throw new NotFoundError("Supplier")
    return suppliersRepository.deactivate(id, tenantId)
  },
}
