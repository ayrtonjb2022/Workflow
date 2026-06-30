import { rolesRepository } from "./roles.repository.js"
import { usersRepository } from "../users/users.repository.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

export const rolesService = {
  async list(tenantId: string) {
    return rolesRepository.findAll(tenantId)
  },

  async get(id: string) {
    const role = await rolesRepository.findById(id)
    if (!role) throw new NotFoundError("Role")
    return role
  },

  async create(data: { name: string; description?: string; tenantId: string; permissionIds: string[] }) {
    return rolesRepository.create(data)
  },

  async update(id: string, data: { name?: string; description?: string }) {
    const role = await rolesRepository.findById(id)
    if (!role) throw new NotFoundError("Role")
    if (role.isSystem) throw new ValidationError("Cannot modify system roles")
    return rolesRepository.update(id, data)
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

  async delete(id: string) {
    const role = await rolesRepository.findById(id)
    if (!role) throw new NotFoundError("Role")
    if (role.isSystem) throw new ValidationError("Cannot delete system roles")
    return rolesRepository.delete(id)
  },
}
