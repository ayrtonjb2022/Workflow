import { auditRepository } from "./audit.repository.js"

const VALID_ENTITY_TYPES = [
  "Quote", "Order", "Invoice", "Customer", "Contact",
  "Supplier", "Product", "Category", "User", "Role",
  "Branch", "Warehouse", "CashRegister",
]

export const auditService = {
  async findMany(params: {
    tenantId: string
    entityType?: string
    userId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    // Validate entityType if provided
    if (params.entityType && !VALID_ENTITY_TYPES.includes(params.entityType)) {
      throw new Error(`Invalid entityType: ${params.entityType}. Valid types: ${VALID_ENTITY_TYPES.join(", ")}`)
    }

    return auditRepository.findMany(params)
  },
}
