import { branchesRepository } from "./branches.repository.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"
import { auditLogger } from "../../lib/audit-logger.js"

export const branchesService = {
  async list(tenantId: string) {
    return branchesRepository.findAll(tenantId)
  },

  async get(id: string, tenantId: string) {
    const branch = await branchesRepository.findById(id, tenantId)
    if (!branch) throw new NotFoundError("Branch")
    return branch
  },

  async create(data: { tenantId: string; name: string; address?: string; phone?: string }, userId: string) {
    // Check name uniqueness
    const existing = await branchesRepository.findByName(data.name, data.tenantId)
    if (existing) {
      throw new ValidationError("A branch with this name already exists in this tenant")
    }

    const branch = await branchesRepository.create(data)

    await auditLogger.log({
      tenantId: data.tenantId,
      userId,
      entityType: "Branch",
      entityId: branch.id,
      action: "CREATE",
      after: branch,
    })

    return branch
  },

  async update(
    id: string,
    tenantId: string,
    data: { name?: string; address?: string; phone?: string },
    userId: string,
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

    const updated = await branchesRepository.update(id, tenantId, data)

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Branch",
      entityId: id,
      action: "UPDATE",
      before: branch,
      after: updated,
    })

    return updated
  },

  async deactivate(id: string, tenantId: string, userId: string) {
    const branch = await branchesRepository.findById(id, tenantId)
    if (!branch) throw new NotFoundError("Branch")

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "Branch",
      entityId: id,
      action: "DELETE",
      before: branch,
      after: null,
    })

    return branchesRepository.deactivate(id, tenantId)
  },
}
