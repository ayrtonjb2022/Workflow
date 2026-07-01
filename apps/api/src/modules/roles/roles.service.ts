import { rolesRepository } from "./roles.repository.js"
import { usersRepository } from "../users/users.repository.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"
import { auditLogger } from "../../lib/audit-logger.js"

export const rolesService = {
  async list(tenantId: string) {
    return rolesRepository.findAll(tenantId)
  },

  async get(id: string) {
    const role = await rolesRepository.findById(id)
    if (!role) throw new NotFoundError("Role")
    return role
  },

  async create(data: { name: string; description?: string; tenantId: string; permissionIds: string[] }, userId: string) {
    const role = await rolesRepository.create(data)

    await auditLogger.log({
      tenantId: data.tenantId,
      userId,
      entityType: "Role",
      entityId: role.id,
      action: "CREATE",
      after: role,
    })

    return role
  },

  async update(id: string, data: { name?: string; description?: string }, userId: string) {
    const role = await rolesRepository.findById(id)
    if (!role) throw new NotFoundError("Role")
    if (role.isSystem) throw new ValidationError("Cannot modify system roles")
    const updated = await rolesRepository.update(id, data)

    await auditLogger.log({
      tenantId: role.tenantId,
      userId,
      entityType: "Role",
      entityId: id,
      action: "UPDATE",
      before: role,
      after: updated,
    })

    return updated
  },

  async setPermissions(id: string, permissionIds: string[]) {
    const role = await rolesRepository.findById(id)
    if (!role) throw new NotFoundError("Role")
    if (role.isSystem) throw new ValidationError("Cannot modify system role permissions")
    return rolesRepository.setPermissions(id, permissionIds)
  },

  async assignUser(userId: string, roleId: string, tenantId: string) {
    const role = await rolesRepository.findById(roleId)
    if (!role) throw new NotFoundError("Role")

    const user = await usersRepository.findById(userId, tenantId)
    if (!user) throw new NotFoundError("User")

    const existing = await rolesRepository.findUserRole(userId, roleId)
    if (existing) throw new ValidationError("User already has this role")

    return usersRepository.assignRole(userId, roleId)
  },

  async removeUser(userId: string, roleId: string, tenantId: string) {
    const role = await rolesRepository.findById(roleId)
    if (!role) throw new NotFoundError("Role")

    const user = await usersRepository.findById(userId, tenantId)
    if (!user) throw new NotFoundError("User")

    const existing = await rolesRepository.findUserRole(userId, roleId)
    if (!existing) throw new NotFoundError("UserRole")

    // Prevent removing the last admin role from the last admin user
    if (role.isSystem && role.name === "admin") {
      const adminCount = await rolesRepository.countAdminUsers(tenantId)
      if (adminCount <= 1) {
        throw new ValidationError("Cannot remove the last admin role from the only admin user")
      }
    }

    return usersRepository.removeRole(userId, roleId)
  },

  async delete(id: string, userId: string) {
    const role = await rolesRepository.findById(id)
    if (!role) throw new NotFoundError("Role")
    if (role.isSystem) throw new ValidationError("Cannot delete system roles")

    await auditLogger.log({
      tenantId: role.tenantId,
      userId,
      entityType: "Role",
      entityId: id,
      action: "DELETE",
      before: role,
      after: null,
    })

    return rolesRepository.delete(id)
  },
}
