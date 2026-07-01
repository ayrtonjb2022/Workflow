import Fastify from "fastify"
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import cookie from "@fastify/cookie"
import multipart from "@fastify/multipart"
import { healthRoutes } from "./routes/health.js"

import { authRoutes } from "./routes/auth.js"
import { userRoutes } from "./routes/users.js"
import { roleRoutes } from "./routes/roles.js"
import { customerRoutes } from "./routes/customers.js"
import { quoteRoutes } from "./routes/quotes.js"
import { orderRoutes } from "./routes/orders.js"
import { invoiceRoutes } from "./routes/invoices.js"
import { productRoutes } from "./routes/products.js"
import { supplierRoutes } from "./routes/suppliers.js"
import { branchRoutes } from "./routes/branches.js"
import { warehouseRoutes } from "./routes/warehouses.js"
import { cashRegisterRoutes } from "./routes/cash-register.js"
import { dashboardRoutes } from "./routes/dashboard.js"
import { reportRoutes } from "./routes/reports.js"

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Plugins
  await app.register(cookie)
  await app.register(multipart)

  // Routes
  await app.register(healthRoutes, { prefix: "/api" })
  await app.register(authRoutes, { prefix: "/api" })
  await app.register(userRoutes, { prefix: "/api" })
  await app.register(roleRoutes, { prefix: "/api" })
  await app.register(customerRoutes, { prefix: "/api" })
  await app.register(quoteRoutes, { prefix: "/api" })
  await app.register(orderRoutes, { prefix: "/api" })
  await app.register(invoiceRoutes, { prefix: "/api" })
  await app.register(productRoutes, { prefix: "/api" })
  await app.register(supplierRoutes, { prefix: "/api" })
  await app.register(branchRoutes, { prefix: "/api" })
  await app.register(warehouseRoutes, { prefix: "/api" })
  await app.register(cashRegisterRoutes, { prefix: "/api" })
  await app.register(dashboardRoutes, { prefix: "/api" })
  await app.register(reportRoutes, { prefix: "/api" })

  return app
}
