import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { authService } from "../modules/auth/auth.service.js"
import { magicLinkService } from "../modules/magic-link/magic-link.service.js"
import { setAuthCookie, clearAuthCookie } from "../lib/cookie.js"
import { AuthError } from "../lib/errors.js"

const REFRESH_TOKEN_DAYS = 7

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", {
    schema: {
      body: Type.Object({
        email: Type.String({ format: "email" }),
        password: Type.String({ minLength: 8 }),
        name: Type.String({ minLength: 2 }),
        companyName: Type.String({ minLength: 2 }),
      }),
    },
  }, async (request, reply) => {
    const body = request.body as { email: string; password: string; name: string; companyName: string }
    const result = await authService.register(body.email, body.password, body.name, body.companyName)
    setAuthCookie(reply, result.accessToken, 900)
    reply.setCookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_DAYS * 86400,
    })
    return result.user
  })

  app.post("/auth/login", {
    schema: {
      body: Type.Object({
        email: Type.String({ format: "email" }),
        password: Type.String(),
      }),
    },
  }, async (request, reply) => {
    const body = request.body as { email: string; password: string }
    const result = await authService.login(body.email, body.password)
    setAuthCookie(reply, result.accessToken, 900)
    reply.setCookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_DAYS * 86400,
    })
    return result.user
  })

  app.get("/auth/me", async (request, reply) => {
    const token = request.cookies?.access_token
    if (!token) {
      return reply.status(401).send({ message: "Not authenticated" })
    }
    try {
      const payload = await authService.verifyAccessToken(token)
      const profile = await authService.getProfile(payload.userId)
      return profile
    } catch {
      return reply.status(401).send({ message: "Invalid or expired token" })
    }
  }),

  app.post("/auth/logout", async (request, reply) => {
    const refreshToken = request.cookies?.refresh_token
    if (refreshToken) {
      await authService.logout(refreshToken)
    }
    clearAuthCookie(reply)
    reply.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })
    return { message: "Logged out" }
  })

  app.post("/auth/refresh", async (request, reply) => {
    const refreshToken = request.cookies?.refresh_token
    if (!refreshToken) {
      throw new AuthError("Refresh token required")
    }
    const result = await authService.refresh(refreshToken)
    setAuthCookie(reply, result.accessToken, 900)
    reply.setCookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_DAYS * 86400,
    })
    return result.user
  })

  app.post("/auth/magic-link", {
    schema: {
      body: Type.Object({
        email: Type.String({ format: "email" }),
      }),
    },
  }, async (request) => {
    const body = request.body as { email: string }
    return magicLinkService.requestMagicLink(body.email)
  })

  app.post("/auth/magic-link/verify", {
    schema: {
      body: Type.Object({
        token: Type.String(),
      }),
    },
  }, async (request, reply) => {
    const body = request.body as { token: string }
    const result = await magicLinkService.verifyMagicLink(body.token)
    setAuthCookie(reply, result.accessToken, 900)
    reply.setCookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_DAYS * 86400,
    })
    return result.user
  })
}
