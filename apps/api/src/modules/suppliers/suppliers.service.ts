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
    // Check duplicate email within tenant
    if (data.email) {
      const existingEmail = await suppliersRepository.findByEmail(data.email, data.tenantId)
      if (existingEmail) throw new ValidationError("A supplier with this email already exists in this tenant")
    }

    // Check duplicate document within tenant (only if both fields are provided)
    if (data.documentType && data.documentNumber) {
      const existingDoc = await suppliersRepository.findByDocument(data.tenantId, data.documentType, data.documentNumber)
      if (existingDoc) throw new ValidationError("A supplier with this document already exists in this tenant")
    }

    return suppliersRepository.create(data)
  },

  async update(id: string, tenantId: string, data: UpdateSupplierInput) {
    const supplier = await suppliersRepository.findById(id, tenantId)
    if (!supplier) throw new NotFoundError("Supplier")

    // Check duplicate email if changing email
    if (data.email && data.email !== supplier.email) {
      const existingEmail = await suppliersRepository.findByEmail(data.email, tenantId)
      if (existingEmail && existingEmail.id !== id) {
        throw new ValidationError("A supplier with this email already exists in this tenant")
      }
    }

    // Check duplicate document if changing document
    if (data.documentType && data.documentNumber) {
      const existingDoc = await suppliersRepository.findByDocument(tenantId, data.documentType, data.documentNumber)
      if (existingDoc && existingDoc.id !== id) {
        throw new ValidationError("A supplier with this document already exists in this tenant")
      }
    }

    return suppliersRepository.update(id, tenantId, data)
  },

  async deactivate(id: string, tenantId: string) {
    const supplier = await suppliersRepository.findById(id, tenantId)
    if (!supplier) throw new NotFoundError("Supplier")
    return suppliersRepository.deactivate(id, tenantId)
  },
}
