import bcrypt from "bcrypt"
import { usersRepository } from "./users.repository.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"
import { auditLogger } from "../../lib/audit-logger.js"

export const usersService = {
  async list(tenantId: string) {
    return usersRepository.findAll(tenantId)
  },

  async get(id: string, tenantId: string) {
    const user = await usersRepository.findById(id, tenantId)
    if (!user) throw new NotFoundError("User")
    return user
  },

  async create(data: { email: string; name: string; password: string; tenantId: string }, userId: string) {
    const existing = await usersRepository.findByEmail(data.email, data.tenantId)
    if (existing) throw new ValidationError("Email already exists in this tenant")

    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await usersRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
      tenantId: data.tenantId,
    })

    await auditLogger.log({
      tenantId: data.tenantId,
      userId,
      entityType: "User",
      entityId: user.id,
      action: "CREATE",
      after: user,
    })

    return user
  },

  async update(id: string, tenantId: string, data: { name?: string; active?: boolean }, userId: string) {
    const user = await usersRepository.findById(id, tenantId)
    if (!user) throw new NotFoundError("User")
    const updated = await usersRepository.update(id, tenantId, data)

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "User",
      entityId: id,
      action: "UPDATE",
      before: user,
      after: updated,
    })

    return updated
  },

  async deactivate(id: string, tenantId: string, userId: string) {
    const user = await usersRepository.findById(id, tenantId)
    if (!user) throw new NotFoundError("User")

    await auditLogger.log({
      tenantId,
      userId,
      entityType: "User",
      entityId: id,
      action: "DELETE",
      before: user,
      after: null,
    })

    return usersRepository.deactivate(id, tenantId)
  },
}
