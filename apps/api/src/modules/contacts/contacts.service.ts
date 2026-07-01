import { contactsRepository } from "./contacts.repository.js"
import { NotFoundError } from "../../lib/errors.js"
import getPrismaClient from "../../lib/prisma.js"

const prisma = getPrismaClient()

export interface CreateContactInput {
  tenantId: string
  customerId: string
  name: string
  email?: string
  phone?: string
  position?: string
}

export const contactsService = {
  async list(customerId: string, tenantId: string) {
    // Verify parent customer is active in tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId, active: true },
    })
    if (!customer) throw new NotFoundError("Customer")

    return contactsRepository.findByCustomer(customerId, tenantId)
  },

  async get(id: string, customerId: string, tenantId: string) {
    const contact = await contactsRepository.findByIdWithCustomer(id, customerId, tenantId)
    if (!contact) throw new NotFoundError("Contact")
    return contact
  },

  async create(data: CreateContactInput) {
    // Verify parent customer is active in tenant
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId: data.tenantId, active: true },
    })
    if (!customer) throw new NotFoundError("Customer")

    return contactsRepository.create(data)
  },

  async delete(id: string, customerId: string, tenantId: string) {
    const contact = await contactsRepository.findByIdWithCustomer(id, customerId, tenantId)
    if (!contact) throw new NotFoundError("Contact")
    return contactsRepository.hardDelete(id, customerId, tenantId)
  },
}
