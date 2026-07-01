import { describe, it, expect, beforeEach, vi } from "vitest"
import { AuthError } from "../../lib/errors.js"

// ── Mocks (hoisted — runs before imports) ────────────────────────────────────

const { mockPrisma } = vi.hoisted(() => {
  const fn = () => vi.fn()
  const mp: Record<string, any> = {
    invoice: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    order: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    quote: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    product: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    category: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
    customer: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    supplier: { findFirst: fn(), findMany: fn(), count: fn(), create: fn(), update: fn() },
    branch: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
    warehouse: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
    cashRegister: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
    cashMovement: { findFirst: fn(), findMany: fn(), create: fn() },
    invoicePayment: { create: fn(), aggregate: fn(), findMany: fn() },
    invoiceItem: { deleteMany: fn() },
    stockMovement: { create: fn() },
    user: { findFirst: fn(), findMany: fn(), create: fn(), update: fn(), findUnique: fn() },
    role: { findFirst: fn(), findMany: fn(), create: fn(), update: fn(), delete: fn(), findUnique: fn() },
    permission: { findMany: fn() },
    userRole: { findUnique: fn(), create: fn(), delete: fn(), count: fn() },
    rolePermission: { deleteMany: fn(), createMany: fn() },
    documentSequence: { findUnique: fn(), update: fn() },
    refreshToken: { findFirst: fn(), create: fn(), update: fn() },
    tenant: { create: fn() },
  }
  const txMock = fn()
  txMock.mockImplementation((cb: (tx: Record<string, any>) => any) => cb(mp))
  mp.$transaction = txMock
  return { mockPrisma: mp }
})

vi.mock("../../lib/prisma.js", () => ({
  default: () => mockPrisma,
}))

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
    compare: vi.fn(),
  },
}))

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-access-token"),
    verify: vi.fn(),
  },
}))

// ── SUT ──────────────────────────────────────────────────────────────────────

import { authService } from "./auth.service.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

// ── Tests ────────────────────────────────────────────────────────────────────

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("register()", () => {
    it("creates user with hashed password and returns tokens", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.role.findFirst.mockResolvedValue({ id: "role-admin", name: "admin", isSystem: true })
      mockPrisma.tenant.create.mockResolvedValue({ id: "tenant-new", name: "Acme Inc", slug: "acme-inc" })
      mockPrisma.user.create.mockResolvedValue({
        id: "user-new", email: "admin@acme.com", name: "Admin", tenantId: "tenant-new",
      })
      mockPrisma.refreshToken.create.mockResolvedValue({ id: "rt-1", token: "refresh-token-hex" })

      const result = await authService.register("admin@acme.com", "securepass123", "Admin", "Acme Inc")

      expect(bcrypt.hash).toHaveBeenCalledWith("securepass123", 12)
      expect(result.accessToken).toBe("mock-access-token")
      expect(result.refreshToken).toBeTruthy()
      expect(result.user.email).toBe("admin@acme.com")
    })

    it("rejects duplicate email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "existing", email: "admin@acme.com" })

      await expect(
        authService.register("admin@acme.com", "pass", "Admin", "Acme Inc"),
      ).rejects.toThrow("Email already registered")
    })
  })

  describe("login()", () => {
    it("returns tokens for valid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1", email: "user@test.com", name: "Test User",
        passwordHash: "$2b$12$hashed", active: true, tenantId: "tenant-1",
      })
      ;(bcrypt.compare as any).mockResolvedValue(true)
      mockPrisma.refreshToken.create.mockResolvedValue({ id: "rt-1" })

      const result = await authService.login("user@test.com", "correct-password")

      expect(bcrypt.compare).toHaveBeenCalledWith("correct-password", "$2b$12$hashed")
      expect(result.accessToken).toBe("mock-access-token")
      expect(result.user.email).toBe("user@test.com")
    })

    it("rejects inactive users", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1", email: "inactive@test.com", active: false,
        passwordHash: "$2b$12$hashed", tenantId: "tenant-1",
      })

      await expect(authService.login("inactive@test.com", "password")).rejects.toThrow(AuthError)
    })

    it("rejects wrong password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1", email: "user@test.com", active: true,
        passwordHash: "$2b$12$hashed", tenantId: "tenant-1",
      })
      ;(bcrypt.compare as any).mockResolvedValue(false)

      await expect(authService.login("user@test.com", "wrong-password")).rejects.toThrow(AuthError)
    })

    it("rejects non-existent email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.login("nobody@test.com", "password")).rejects.toThrow(AuthError)
    })
  })

  describe("verifyAccessToken()", () => {
    it("returns payload for valid JWT", async () => {
      const payload = { userId: "user-1", email: "user@test.com", tenantId: "tenant-1" }
      ;(jwt.verify as any).mockReturnValue(payload)

      const result = await authService.verifyAccessToken("valid-token")
      expect(result).toEqual(payload)
    })

    it("throws AuthError for invalid JWT", async () => {
      ;(jwt.verify as any).mockImplementation(() => { throw new Error("jwt malformed") })

      await expect(authService.verifyAccessToken("bad-token")).rejects.toThrow(AuthError)
    })
  })

  describe("getProfile()", () => {
    it("returns profile with roles and permissions", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1", email: "user@test.com", name: "Test User", tenantId: "tenant-1",
        roles: [{
          role: {
            name: "admin",
            rolePermissions: [
              { permission: { name: "invoices:read" } },
              { permission: { name: "invoices:write" } },
            ],
          },
        }],
      })

      const profile = await authService.getProfile("user-1")
      expect(profile.roles).toContain("admin")
      expect(profile.permissions).toContain("invoices:read")
      expect(profile.permissions).toContain("invoices:write")
    })

    it("throws AuthError when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      await expect(authService.getProfile("user-404")).rejects.toThrow(AuthError)
    })
  })

  describe("refresh()", () => {
    it("rotates refresh token and returns new tokens", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      mockPrisma.refreshToken.findUnique = vi.fn().mockResolvedValue({
        id: "rt-1", token: "old-refresh-token", userId: "user-1", tenantId: "tenant-1",
        revokedAt: null, expiresAt: futureDate,
      })
      mockPrisma.refreshToken.update = vi.fn().mockResolvedValue({ id: "rt-1", revokedAt: new Date() })
      mockPrisma.refreshToken.create = vi.fn().mockResolvedValue({ id: "rt-new" })
      mockPrisma.user.findUnique = vi.fn().mockResolvedValue({
        id: "user-1", email: "user@test.com", active: true, tenantId: "tenant-1",
      })

      const result = await authService.refresh("old-refresh-token")
      expect(result.accessToken).toBe("mock-access-token")
      expect(result.refreshToken).toBeTruthy()
    })
  })

  describe("logout()", () => {
    it("revokes the refresh token", async () => {
      mockPrisma.refreshToken.findUnique = vi.fn().mockResolvedValue({ id: "rt-1", token: "some-token" })
      mockPrisma.refreshToken.update = vi.fn().mockResolvedValue({ id: "rt-1", revokedAt: new Date() })

      await authService.logout("some-token")
      expect(mockPrisma.refreshToken.update).toHaveBeenCalled()
    })

    it("does not throw when token does not exist", async () => {
      mockPrisma.refreshToken.findUnique = vi.fn().mockResolvedValue(null)
      await expect(authService.logout("nonexistent")).resolves.not.toThrow()
    })
  })
})
