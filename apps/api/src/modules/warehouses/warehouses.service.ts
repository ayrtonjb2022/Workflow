import { warehousesRepository } from "./warehouses.repository.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

export const warehousesService = {
  async list(tenantId: string) {
    return warehousesRepository.findAll(tenantId)
  },

  async get(id: string, tenantId: string) {
    const warehouse = await warehousesRepository.findById(id, tenantId)
    if (!warehouse) throw new NotFoundError("Warehouse")
    return warehouse
  },

  async create(data: { tenantId: string; name: string; address?: string }) {
    // Check name uniqueness
    const existing = await warehousesRepository.findByName(data.name, data.tenantId)
    if (existing) {
      throw new ValidationError("A warehouse with this name already exists in this tenant")
    }

    return warehousesRepository.create(data)
  },

  async update(
    id: string,
    tenantId: string,
    data: { name?: string; address?: string },
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

    return warehousesRepository.update(id, tenantId, data)
  },

  async deactivate(id: string, tenantId: string) {
    const warehouse = await warehousesRepository.findById(id, tenantId)
    if (!warehouse) throw new NotFoundError("Warehouse")
    return warehousesRepository.deactivate(id, tenantId)
  },
}
