import { type FastifyReply } from "fastify"
import "@fastify/cookie"

const isProduction = process.env.NODE_ENV === "production"

export const cookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
}

export function setAuthCookie(reply: FastifyReply, token: string, maxAge: number): void {
  reply.setCookie("access_token", token, {
    ...cookieConfig,
    maxAge,
  })
}

export function clearAuthCookie(reply: FastifyReply): void {
  reply.clearCookie("access_token", cookieConfig)
}
