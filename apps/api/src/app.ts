import Fastify from "fastify"
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import { healthRoutes } from "./routes/health.js"

export function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Health check route
  app.register(healthRoutes, { prefix: "/api" })

  return app
}
