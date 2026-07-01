import { FastifyInstance } from "fastify"
import { authGuard } from "../plugins/auth-guard.js"
import getPrismaClient from "../lib/prisma.js"
import { fromDecimal } from "../lib/currency.js"

const prisma = getPrismaClient()

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  app.get("/dashboard/stats", async (request) => {
    const { tenantId } = request

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // ── Monthly revenue (PAID invoices this month) ──
    const revenueAgg = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: "PAID",
        createdAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { total: true },
    })
    const monthlyRevenue = fromDecimal(revenueAgg._sum.total)

    // ── Monthly invoices count ──
    const monthlyInvoices = await prisma.invoice.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
    })

    // ── Pending orders (SENT) ──
    const pendingOrders = await prisma.order.count({
      where: { tenantId, status: "SENT" },
    })

    // ── Open quotes (SENT) ──
    const openQuotes = await prisma.quote.count({
      where: { tenantId, status: "SENT" },
    })

    // ── Low stock products (stock < min_stock AND active) ──
    // Prisma can't compare two columns directly, so we use a raw query
    const lowStockResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int AS count
      FROM products
      WHERE tenant_id = ${tenantId} AND active = true AND stock < min_stock
    `
    const lowStockProducts = Number(lowStockResult[0]?.count ?? 0)

    // ── Recent activity: last 5 of each type ──
    const [recentQuotes, recentOrders, recentInvoices] = await Promise.all([
      prisma.quote.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
      prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
      prisma.invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
    ])

    const allActivity = [
      ...recentQuotes.map((q) => ({
        type: "quote" as const,
        id: q.id,
        number: q.number,
        status: q.status,
        customerName: q.customer.name,
        total: fromDecimal(q.total),
        createdAt: q.createdAt.toISOString(),
      })),
      ...recentOrders.map((o) => ({
        type: "order" as const,
        id: o.id,
        number: o.number,
        status: o.status,
        customerName: o.customer.name,
        total: fromDecimal(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
      ...recentInvoices.map((i) => ({
        type: "invoice" as const,
        id: i.id,
        number: i.number,
        status: i.status,
        customerName: i.customer.name,
        total: fromDecimal(i.total),
        createdAt: i.createdAt.toISOString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10)

    // ── Top products by quantity sold in PAID invoices ──
    const topProductsRaw = await prisma.invoiceItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, subtotal: true },
      where: {
        invoice: { tenantId, status: "PAID" },
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    })

    const productIds = topProductsRaw.map((p) => p.productId)
    const products =
      productIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
          })
        : []
    const productMap = new Map(products.map((p) => [p.id, p.name]))

    const topProducts = topProductsRaw.map((p) => ({
      name: productMap.get(p.productId) ?? "Unknown",
      totalSold: p._sum.quantity ?? 0,
      revenue: fromDecimal(p._sum.subtotal),
    }))

    return {
      monthlyRevenue,
      monthlyInvoices,
      pendingOrders,
      openQuotes,
      lowStockProducts,
      recentActivity: allActivity,
      topProducts,
    }
  })
}
