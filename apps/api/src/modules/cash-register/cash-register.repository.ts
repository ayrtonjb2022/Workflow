import getPrismaClient from "../../lib/prisma.js"
import type { Prisma } from "@prisma/client"

const prisma = getPrismaClient()

export const cashRegisterRepository = {
  async findAll(tenantId: string) {
    return prisma.cashRegister.findMany({
      where: { tenantId },
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async findById(id: string, tenantId: string) {
    return prisma.cashRegister.findFirst({
      where: { id, tenantId },
      include: {
        branch: { select: { id: true, name: true } },
        cashMovements: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
  },

  async findByName(name: string, tenantId: string) {
    return prisma.cashRegister.findFirst({
      where: { name, tenantId },
    })
  },

  async create(data: {
    tenantId: string
    name: string
    branchId?: string
    balance: number
    openedAt: Date
  }) {
    const createData: Record<string, unknown> = {
      tenantId: data.tenantId,
      name: data.name,
      balance: data.balance,
      openedAt: data.openedAt,
    }

    if (data.branchId) {
      createData.branchId = data.branchId
    }

    return prisma.cashRegister.create({
      data: createData as Prisma.CashRegisterCreateInput,
      include: { branch: { select: { id: true, name: true } } },
    })
  },

  async update(
    id: string,
    tenantId: string,
    data: { name?: string; branchId?: string | null },
  ) {
    return prisma.cashRegister.update({
      where: { id, tenantId },
      data,
      include: { branch: { select: { id: true, name: true } } },
    })
  },

  async deactivate(id: string, tenantId: string) {
    return prisma.cashRegister.update({
      where: { id, tenantId },
      data: { active: false },
      include: { branch: { select: { id: true, name: true } } },
    })
  },

  async createMovement(data: {
    tenantId: string
    cashRegisterId: string
    type: "IN" | "OUT"
    amount: number
    description?: string
    reference?: string
  }) {
    const createData: Record<string, unknown> = {
      tenantId: data.tenantId,
      cashRegisterId: data.cashRegisterId,
      type: data.type,
      amount: data.amount,
    }

    if (data.description !== undefined) createData.description = data.description
    if (data.reference !== undefined) createData.reference = data.reference

    return prisma.cashMovement.create({
      data: createData as Prisma.CashMovementCreateInput,
    })
  },

  async updateBalance(
    tx: Prisma.TransactionClient,
    cashRegisterId: string,
    tenantId: string,
    newBalance: number,
  ) {
    return tx.cashRegister.update({
      where: { id: cashRegisterId, tenantId },
      data: { balance: newBalance },
    })
  },
}
