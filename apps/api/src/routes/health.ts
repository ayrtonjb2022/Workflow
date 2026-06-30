import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"

export async function healthRoutes(app: FastifyInstance) {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: Type.Object({
            status: Type.String(),
            timestamp: Type.String(),
          }),
        },
      },
    },
    async () => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
      }
    },
  )
}
