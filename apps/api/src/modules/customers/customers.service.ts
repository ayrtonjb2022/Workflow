import { customersRepository } from "./customers.repository.js"
import type { DocumentType } from "../../lib/prisma.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

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

  async create(data: CreateCustomerInput) {
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

    return customersRepository.create(data)
  },

  async update(id: string, tenantId: string, data: UpdateCustomerInput) {
    const customer = await customersRepository.findById(id, tenantId)
    if (!customer) throw new NotFoundError("Customer")
    return customersRepository.update(id, tenantId, data)
  },

  async deactivate(id: string, tenantId: string) {
    const customer = await customersRepository.findById(id, tenantId)
    if (!customer) throw new NotFoundError("Customer")
    return customersRepository.deactivate(id, tenantId)
  },
}
