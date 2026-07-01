import Fastify from "fastify"
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import cookie from "@fastify/cookie"
import multipart from "@fastify/multipart"
import { healthRoutes } from "./routes/health.js"
import { authGuardPlugin } from "./plugins/auth-guard.js"
import { authRoutes } from "./routes/auth.js"
import { userRoutes } from "./routes/users.js"
import { roleRoutes } from "./routes/roles.js"
import { customerRoutes } from "./routes/customers.js"
import { quoteRoutes } from "./routes/quotes.js"
import { orderRoutes } from "./routes/orders.js"
import { invoiceRoutes } from "./routes/invoices.js"

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Plugins
  await app.register(cookie)
  await app.register(multipart)
  await app.register(authGuardPlugin)

  // Routes
  await app.register(healthRoutes, { prefix: "/api" })
  await app.register(authRoutes, { prefix: "/api" })
  await app.register(userRoutes, { prefix: "/api" })
  await app.register(roleRoutes, { prefix: "/api" })
  await app.register(customerRoutes, { prefix: "/api" })
  await app.register(quoteRoutes, { prefix: "/api" })
  await app.register(orderRoutes, { prefix: "/api" })
  await app.register(invoiceRoutes, { prefix: "/api" })

  return app
}
