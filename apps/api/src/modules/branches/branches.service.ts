import { branchesRepository } from "./branches.repository.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

export const branchesService = {
  async list(tenantId: string) {
    return branchesRepository.findAll(tenantId)
  },

  async get(id: string, tenantId: string) {
    const branch = await branchesRepository.findById(id, tenantId)
    if (!branch) throw new NotFoundError("Branch")
    return branch
  },

  async create(data: { tenantId: string; name: string; address?: string; phone?: string }) {
    // Check name uniqueness
    const existing = await branchesRepository.findByName(data.name, data.tenantId)
    if (existing) {
      throw new ValidationError("A branch with this name already exists in this tenant")
    }

    return branchesRepository.create(data)
  },

  async update(
    id: string,
    tenantId: string,
    data: { name?: string; address?: string; phone?: string },
  ) {
    const branch = await branchesRepository.findById(id, tenantId)
    if (!branch) throw new NotFoundError("Branch")

    // Check name uniqueness if changing name
    if (data.name && data.name !== branch.name) {
      const existing = await branchesRepository.findByName(data.name, tenantId)
      if (existing && existing.id !== id) {
        throw new ValidationError("A branch with this name already exists in this tenant")
      }
    }

    return branchesRepository.update(id, tenantId, data)
  },

  async deactivate(id: string, tenantId: string) {
    const branch = await branchesRepository.findById(id, tenantId)
    if (!branch) throw new NotFoundError("Branch")
    return branchesRepository.deactivate(id, tenantId)
  },
}
