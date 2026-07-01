import { contactsRepository } from "./contacts.repository.js"
import { NotFoundError } from "../../lib/errors.js"
import { auditLogger } from "../../lib/audit-logger.js"
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
    // Verify parent customer exists in tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    })
    if (!customer) throw new NotFoundError("Customer")

    return contactsRepository.findByCustomer(customerId, tenantId)
  },

  async get(id: string, customerId: string, tenantId: string) {
    const contact = await contactsRepository.findByIdWithCustomer(id, customerId, tenantId)
    if (!contact) throw new NotFoundError("Contact")
    return contact
  },

  async create(data: CreateContactInput, userId: string) {
    // Verify parent customer exists in tenant
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId: data.tenantId },
    })
    if (!customer) throw new NotFoundError("Customer")

    const contact = await contactsRepository.create(data)

    await auditLogger.log({
      tenantId: data.tenantId,
      userId,
      entityType: "Contact",
      entityId: contact.id,
      action: "CREATE",
      after: contact,
    })

    return contact
  },

  async delete(id: string, customerId: string, tenantId: string, userId: string) {
    const contact = await contactsRepository.findByIdWithCustomer(id, customerId, tenantId)
    if (!contact) throw new NotFoundError("Contact")

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Contact",
      entityId: id,
      action: "DELETE",
      before: contact,
      after: null,
    })

    return contactsRepository.hardDelete(id, customerId, tenantId)
  },
}
