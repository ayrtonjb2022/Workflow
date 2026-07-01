import { FastifyInstance } from "fastify"
import { authGuard } from "../plugins/auth-guard.js"
import getPrismaClient from "../lib/prisma.js"
import { fromDecimal } from "../lib/currency.js"

const prisma = getPrismaClient()

export async function reportRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // ── GET /api/reports/sales ──────────────────────────────────
  app.get("/reports/sales", async (request) => {
    const { tenantId } = request
    const query = request.query as { from?: string; to?: string }

    const now = new Date()
    const to = query.to ? new Date(query.to) : now
    const from = query.from
      ? new Date(query.from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    to.setHours(23, 59, 59, 999)
    from.setHours(0, 0, 0, 0)

    // Fetch all invoices in range (only fields we need)
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        date: { gte: from, lte: to },
      },
      select: { id: true, status: true, total: true, date: true },
    })

    const totalInvoices = invoices.length
    const paidInvoices = invoices.filter((i) => i.status === "PAID")
    const pendingInvoices = invoices.filter((i) => i.status === "SENT")
    const cancelledInvoices = invoices.filter((i) => i.status === "CANCELLED")

    const totalRevenue = paidInvoices.reduce(
      (sum, i) => sum + fromDecimal(i.total),
      0,
    )
    const averageTicket = totalInvoices > 0 ? totalRevenue / totalInvoices : 0

    // ── byDay — fill every day in range ──
    const byDayMap = new Map<string, { count: number; revenue: number }>()
    const cursor = new Date(from)
    while (cursor <= to) {
      const key = cursor.toISOString().split("T")[0]
      byDayMap.set(key, { count: 0, revenue: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    for (const inv of invoices) {
      const key = inv.date.toISOString().split("T")[0]
      const entry = byDayMap.get(key)!
      entry.count++
      if (inv.status === "PAID") {
        entry.revenue += fromDecimal(inv.total)
      }
    }

    const byDay = Array.from(byDayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }))

    // ── byStatus ──
    const statusMap = new Map<string, { count: number; total: number }>()
    for (const inv of invoices) {
      const entry = statusMap.get(inv.status) ?? { count: 0, total: 0 }
      entry.count++
      entry.total += fromDecimal(inv.total)
      statusMap.set(inv.status, entry)
    }

    const byStatus = Array.from(statusMap.entries()).map(
      ([status, data]) => ({ status, ...data }),
    )

    return {
      totalRevenue,
      totalInvoices,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      cancelledInvoices: cancelledInvoices.length,
      averageTicket,
      byDay,
      byStatus,
    }
  })

  // ── GET /api/reports/stock ──────────────────────────────────
  app.get("/reports/stock", async (request) => {
    const { tenantId } = request
    const query = request.query as { lowOnly?: string }
    const lowOnly = query.lowOnly === "true"

    const allProducts = await prisma.product.findMany({
      where: { tenantId, active: true },
      include: { category: { select: { name: true } } },
      orderBy: { stock: "asc" },
    })

    const mapped = allProducts.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category?.name ?? null,
      stock: p.stock,
      minStock: p.minStock,
      unitPrice: fromDecimal(p.unitPrice),
      status: (p.stock === 0
        ? "critical"
        : p.stock < p.minStock
          ? "low"
          : "ok") as "ok" | "low" | "critical",
    }))

    const lowStockCount = mapped.filter((p) => p.status !== "ok").length
    const products = lowOnly ? mapped.filter((p) => p.status !== "ok") : mapped

    return {
      totalProducts: allProducts.length,
      lowStockCount,
      products,
    }
  })
}
