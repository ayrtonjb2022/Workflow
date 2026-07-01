export type CashMovementType = "IN" | "OUT"

export interface CashMovement {
  id: string
  tenantId: string
  cashRegisterId: string
  type: CashMovementType
  amount: number
  description: string | null
  reference: string | null
  createdAt: string
}

export interface CashRegister {
  id: string
  tenantId: string
  branchId: string | null
  name: string
  balance: number
  openedAt: string | null
  closedAt: string | null
  active: boolean
  createdAt: string
  branch: { id: string; name: string } | null
  cashMovements?: CashMovement[]
}
