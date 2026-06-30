import crypto from "node:crypto"
import { magicLinkRepository } from "./magic-link.repository.js"
import { authRepository } from "../auth/auth.repository.js"
import { authService } from "../auth/auth.service.js"
import { AuthError } from "../../lib/errors.js"
import type { AuthResult } from "../auth/auth.service.js"

const MAGIC_LINK_EXPIRY_MINUTES = 15

export const magicLinkService = {
  async requestMagicLink(email: string): Promise<{ message: string }> {
    const user = await authRepository.findByEmail(email)
    if (!user) {
      // Don't reveal if email exists — return same message
      return { message: "If the email exists, a magic link has been sent" }
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + MAGIC_LINK_EXPIRY_MINUTES)

    await magicLinkRepository.saveToken({
      token,
      userId: user.id,
      tenantId: user.tenantId,
      expiresAt,
    })

    console.log(`[MAGIC LINK] ${email} → ${token}`)
    return { message: "If the email exists, a magic link has been sent" }
  },

  async verifyMagicLink(token: string): Promise<AuthResult> {
    const stored = await magicLinkRepository.findToken(token)
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AuthError("Invalid or expired magic link")
    }

    await magicLinkRepository.revokeToken(stored.id)

    const user = await authRepository.findById(stored.userId)
    if (!user || !user.active) {
      throw new AuthError("User not found or inactive")
    }

    return authService.generateTokens(user.id, user.email, user.tenantId)
  },
}
