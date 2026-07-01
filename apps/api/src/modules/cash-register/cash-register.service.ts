import { cashRegisterRepository } from "./cash-register.repository.js"
import getPrismaClient from "../../lib/prisma.js"
import { toDecimal, fromDecimal } from "../../lib/currency.js"
import { NotFoundError, ValidationError } from "../../lib/errors.js"

const prisma = getPrismaClient()

export const cashRegisterService = {
  async list(tenantId: string) {
    const registers = await cashRegisterRepository.findAll(tenantId)
    return registers.map((r) => ({
      ...r,
      balance: fromDecimal(r.balance),
    }))
  },

  async get(id: string, tenantId: string) {
    const register = await cashRegisterRepository.findById(id, tenantId)
    if (!register) throw new NotFoundError("CashRegister")

    return {
      ...register,
      balance: fromDecimal(register.balance),
      cashMovements: register.cashMovements.map((m) => ({
        ...m,
        amount: fromDecimal(m.amount),
      })),
    }
  },

  async create(data: {
    tenantId: string
    name: string
    branchId?: string
  }) {
    // Check name uniqueness
    const existing = await cashRegisterRepository.findByName(data.name, data.tenantId)
    if (existing) {
      throw new ValidationError("A cash register with this name already exists in this tenant")
    }

    const register = await cashRegisterRepository.create({
      tenantId: data.tenantId,
      name: data.name,
      branchId: data.branchId,
      balance: 0,
      openedAt: new Date(),
    })

    return {
      ...register,
      balance: fromDecimal(register.balance),
    }
  },

  async openRegister(id: string, tenantId: string) {
    const register = await cashRegisterRepository.findById(id, tenantId)
    if (!register) throw new NotFoundError("CashRegister")

    if (!register.active) {
      throw new ValidationError("Cannot open a deactivated cash register")
    }

    if (register.openedAt && !register.closedAt) {
      throw new ValidationError("Cash register is already open")
    }

    const updated = await prisma.cashRegister.update({
      where: { id, tenantId },
      data: { openedAt: new Date(), closedAt: null },
      include: { branch: { select: { id: true, name: true } } },
    })

    return {
      ...updated,
      balance: fromDecimal(updated.balance),
    }
  },

  async closeRegister(id: string, tenantId: string) {
    const register = await cashRegisterRepository.findById(id, tenantId)
    if (!register) throw new NotFoundError("CashRegister")

    if (!register.active) {
      throw new ValidationError("Cannot close a deactivated cash register")
    }

    if (!register.openedAt) {
      throw new ValidationError("Cash register is not open")
    }

    if (register.closedAt) {
      throw new ValidationError("Cash register is already closed")
    }

    const updated = await prisma.cashRegister.update({
      where: { id, tenantId },
      data: { closedAt: new Date() },
      include: { branch: { select: { id: true, name: true } } },
    })

    return {
      ...updated,
      balance: fromDecimal(updated.balance),
    }
  },

  async addMovement(
    id: string,
    tenantId: string,
    type: "IN" | "OUT",
    amount: number,
    description?: string,
    reference?: string,
  ) {
    if (amount <= 0) {
      throw new ValidationError("Amount must be greater than zero")
    }

    const decimalAmount = toDecimal(amount)

    return prisma.$transaction(async (tx) => {
      const register = await tx.cashRegister.findFirst({
        where: { id, tenantId },
      })

      if (!register) {
        throw new NotFoundError("CashRegister")
      }

      if (!register.active) {
        throw new ValidationError("Cannot add movement to a deactivated cash register")
      }

      if (!register.openedAt) {
        throw new ValidationError("Cash register is not open. Open it before adding movements")
      }

      if (register.closedAt) {
        throw new ValidationError("Cash register is closed. Open it before adding movements")
      }

      const currentBalance = fromDecimal(register.balance)
      let newBalance: number

      if (type === "IN") {
        newBalance = currentBalance + decimalAmount
      } else {
        if (currentBalance < decimalAmount) {
          throw new ValidationError(
            `Insufficient balance. Current: ${currentBalance.toFixed(2)}, requested: ${decimalAmount.toFixed(2)}`,
          )
        }
        newBalance = currentBalance - decimalAmount
      }

      // Create movement record
      const movement = await cashRegisterRepository.createMovement({
        tenantId,
        cashRegisterId: id,
        type,
        amount: decimalAmount,
        description,
        reference,
      })

      // Update balance
      await cashRegisterRepository.updateBalance(tx, id, tenantId, newBalance)

      return {
        ...movement,
        amount: fromDecimal(movement.amount),
      }
    })
  },
}
