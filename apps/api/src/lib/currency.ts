// Prisma returns Decimal as string, convert to number for API responses
export function fromDecimal(value: unknown): number {
  if (value == null) return 0
  return Number(value)
}

// Convert number to Decimal-compatible value for Prisma
export function toDecimal(value: number): number {
  return Math.round(value * 100) / 100 // 2 decimal places
}
