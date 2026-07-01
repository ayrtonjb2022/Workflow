import { FastifyRequest, FastifyReply } from "fastify"
import { ForbiddenError, AuthError } from "../lib/errors.js"
import getPrismaClient from "../lib/prisma.js"

const prisma = getPrismaClient()

export async function authGuard(request: FastifyRequest, _reply: FastifyReply) {
  const token = request.cookies?.access_token
  if (!token) {
    throw new AuthError()
  }

  // Verify token via auth service
  const { authService } = await import("../modules/auth/auth.service.js")
  let payload: { userId: string; email: string; tenantId: string }
  try {
    payload = await authService.verifyAccessToken(token)
  } catch {
    throw new AuthError("Invalid or expired token")
  }

  // Attach user info to request
  request.userId = payload.userId
  request.tenantId = payload.tenantId

  // Check required permission if specified in route config (Fastify 5)
  const requiredPermission = (request.routeOptions.config as unknown as Record<string, unknown>)?.requiredPermission as string | undefined
  if (requiredPermission) {
    const hasPermission = await checkUserPermission(payload.userId, requiredPermission)
    if (!hasPermission) {
      throw new ForbiddenError()
    }
  }
}

async function checkUserPermission(userId: string, requiredPermission: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  })

  if (!user) return false

  return user.roles.some((ur) =>
    ur.role.rolePermissions.some(
      (rp) => rp.permission.name === requiredPermission
    )
  )
}

// Type augmentation for Fastify
declare module "fastify" {
  interface FastifyRequest {
    userId: string
    tenantId: string
  }
}
