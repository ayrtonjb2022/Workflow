import { warehousesRepository } from "./warehouses.repository.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"
import { auditLogger } from "../../lib/audit-logger.js"

export const warehousesService = {
  async list(tenantId: string) {
    return warehousesRepository.findAll(tenantId)
  },

  async get(id: string, tenantId: string) {
    const warehouse = await warehousesRepository.findById(id, tenantId)
    if (!warehouse) throw new NotFoundError("Warehouse")
    return warehouse
  },

  async create(data: { tenantId: string; name: string; address?: string }, userId: string) {
    // Check name uniqueness
    const existing = await warehousesRepository.findByName(data.name, data.tenantId)
    if (existing) {
      throw new ValidationError("A warehouse with this name already exists in this tenant")
    }

    const warehouse = await warehousesRepository.create(data)

    await auditLogger.log({
      tenantId: data.tenantId,
      userId,
      entityType: "Warehouse",
      entityId: warehouse.id,
      action: "CREATE",
      after: warehouse,
    })

    return warehouse
  },

  async update(
    id: string,
    tenantId: string,
    data: { name?: string; address?: string },
    userId: string,
  ) {
    const warehouse = await warehousesRepository.findById(id, tenantId)
    if (!warehouse) throw new NotFoundError("Warehouse")

    // Check name uniqueness if changing name
    if (data.name && data.name !== warehouse.name) {
      const existing = await warehousesRepository.findByName(data.name, tenantId)
      if (existing && existing.id !== id) {
        throw new ValidationError("A warehouse with this name already exists in this tenant")
      }
    }

    const updated = await warehousesRepository.update(id, tenantId, data)

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Warehouse",
      entityId: id,
      action: "UPDATE",
      before: warehouse,
      after: updated,
    })

    return updated
  },

  async deactivate(id: string, tenantId: string, userId: string) {
    const warehouse = await warehousesRepository.findById(id, tenantId)
    if (!warehouse) throw new NotFoundError("Warehouse")

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Warehouse",
      entityId: id,
      action: "DELETE",
      before: warehouse,
      after: null,
    })

    return warehousesRepository.deactivate(id, tenantId)
  },
}
