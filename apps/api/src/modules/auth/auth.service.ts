import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "node:crypto"
import { authRepository } from "./auth.repository.js"
import { AuthError } from "../../lib/errors.js"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"
const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_DAYS = 7

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string }
}

export const authService = {
  async register(email: string, password: string, name: string, companyName: string): Promise<AuthResult> {
    const existing = await authRepository.findByEmail(email)
    if (existing) {
      throw new AuthError("Email already registered")
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")

    const tenant = await authRepository.createTenant(companyName, slug)
    const user = await authRepository.createUserWithAdminRole({ email, name, passwordHash, tenant })

    return this.generateTokens(user.id, user.email, tenant.id)
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await authRepository.findByEmail(email)
    if (!user || !user.active) {
      throw new AuthError("Invalid credentials")
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw new AuthError("Invalid credentials")
    }

    return this.generateTokens(user.id, user.email, user.tenantId)
  },

  async refresh(refreshTokenStr: string): Promise<AuthResult> {
    const stored = await authRepository.findRefreshToken(refreshTokenStr)
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AuthError("Invalid or expired refresh token")
    }

    // Rotation: revoke old, issue new
    await authRepository.revokeRefreshToken(stored.id)

    const user = await authRepository.findById(stored.userId)
    if (!user || !user.active) {
      throw new AuthError("User not found or inactive")
    }

    return this.generateTokens(user.id, user.email, user.tenantId)
  },

  async logout(refreshTokenStr: string): Promise<void> {
    const stored = await authRepository.findRefreshToken(refreshTokenStr)
    if (stored) {
      await authRepository.revokeRefreshToken(stored.id)
    }
  },

  async getProfile(userId: string) {
    const profile = await authRepository.getProfile(userId)
    if (!profile) {
      throw new AuthError("User not found")
    }

    const permissions = new Set<string>()
    const roles: string[] = []
    for (const ur of profile.roles) {
      roles.push(ur.role.name)
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.name)
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      tenantId: profile.tenantId,
      roles,
      permissions: Array.from(permissions),
    }
  },

  async verifyAccessToken(token: string): Promise<{ userId: string; email: string; tenantId: string }> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; tenantId: string }
      return payload
    } catch {
      throw new AuthError("Invalid or expired token")
    }
  },

  async generateTokens(userId: string, email: string, tenantId: string): Promise<AuthResult> {
    const accessToken = jwt.sign({ userId, email, tenantId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const refreshTokenStr = crypto.randomBytes(40).toString("hex")

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS)

    await authRepository.saveRefreshToken({
      token: refreshTokenStr,
      userId,
      tenantId,
      expiresAt,
    })

    return {
      accessToken,
      refreshToken: refreshTokenStr,
      user: { id: userId, email, name: "" },
    }
  },
}
