import bcrypt from "bcrypt"
import { usersRepository } from "./users.repository.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

export const usersService = {
  async list(tenantId: string) {
    return usersRepository.findAll(tenantId)
  },

  async get(id: string, tenantId: string) {
    const user = await usersRepository.findById(id, tenantId)
    if (!user) throw new NotFoundError("User")
    return user
  },

  async create(data: { email: string; name: string; password: string; tenantId: string }) {
    const existing = await usersRepository.findByEmail(data.email, data.tenantId)
    if (existing) throw new ValidationError("Email already exists in this tenant")

    const passwordHash = await bcrypt.hash(data.password, 12)
    return usersRepository.create({ ...data, passwordHash })
  },

  async update(id: string, tenantId: string, data: { name?: string; active?: boolean }) {
    const user = await usersRepository.findById(id, tenantId)
    if (!user) throw new NotFoundError("User")
    return usersRepository.update(id, tenantId, data)
  },

  async deactivate(id: string, tenantId: string) {
    const user = await usersRepository.findById(id, tenantId)
    if (!user) throw new NotFoundError("User")
    return usersRepository.deactivate(id, tenantId)
  },
}
