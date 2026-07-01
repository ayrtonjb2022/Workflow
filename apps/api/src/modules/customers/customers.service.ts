import { customersRepository } from "./customers.repository.js"
import type { DocumentType } from "../../lib/prisma.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"
import { auditLogger } from "../../lib/audit-logger.js"

export interface CreateCustomerInput {
  tenantId: string
  branchId?: string
  name: string
  email?: string
  phone?: string
  documentType: DocumentType
  documentNumber: string
  address?: string
}

export interface UpdateCustomerInput {
  name?: string
  email?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
  address?: string
  branchId?: string
}

export const customersService = {
  async list(tenantId: string, page?: number, limit?: number, search?: string) {
    return customersRepository.findAll(tenantId, page, limit, search)
  },

  async get(id: string, tenantId: string) {
    const customer = await customersRepository.findById(id, tenantId)
    if (!customer) throw new NotFoundError("Customer")
    return customer
  },

  async create(data: CreateCustomerInput, userId: string) {
    // Check duplicate email within tenant
    if (data.email) {
      const existingEmail = await customersRepository.findByEmail(data.email, data.tenantId)
      if (existingEmail) throw new ValidationError("A customer with this email already exists in this tenant")
    }

    // Check duplicate document within tenant
    if (data.documentType && data.documentNumber) {
      const existingDoc = await customersRepository.findByDocument(data.tenantId, data.documentType, data.documentNumber)
      if (existingDoc) throw new ValidationError("A customer with this document already exists in this tenant")
    }

    const customer = await customersRepository.create(data)

    await auditLogger.log({
      tenantId: data.tenantId,
      userId,
      entityType: "Customer",
      entityId: customer.id,
      action: "CREATE",
      after: customer,
    })

    return customer
  },

  async update(id: string, tenantId: string, data: UpdateCustomerInput, userId: string) {
    const customer = await customersRepository.findById(id, tenantId)
    if (!customer) throw new NotFoundError("Customer")
    const updated = await customersRepository.update(id, tenantId, data)

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Customer",
      entityId: id,
      action: "UPDATE",
      before: customer,
      after: updated,
    })

    return updated
  },

  async deactivate(id: string, tenantId: string, userId: string) {
    const customer = await customersRepository.findById(id, tenantId)
    if (!customer) throw new NotFoundError("Customer")
    const updated = await customersRepository.deactivate(id, tenantId)

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Customer",
      entityId: id,
      action: "DELETE",
      before: customer,
      after: null,
    })

    return updated
  },
}
