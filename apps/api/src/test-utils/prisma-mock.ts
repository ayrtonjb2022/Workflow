// Build a mock Prisma client with all models used across services.
// $transaction executes the callback with the same mock object as tx.
//
// This factory takes `fn` as a parameter so it does NOT need module imports.
// It can be called either from vi.hoisted() or from module-level code.

export interface MockModel {
  findFirst?: any
  findMany?: any
  count?: any
  create?: any
  update?: any
  findUnique?: any
  delete?: any
  deleteMany?: any
  createMany?: any
  aggregate?: any
  [key: string]: any
}

export function createMockPrisma(fn: () => any) {
  const newFn = () => fn()

  const mockPrisma: Record<string, any> = {
    invoice: { findFirst: newFn(), findMany: newFn(), count: newFn(), create: newFn(), update: newFn() },
    order: { findFirst: newFn(), findMany: newFn(), count: newFn(), create: newFn(), update: newFn() },
    quote: { findFirst: newFn(), findMany: newFn(), count: newFn(), create: newFn(), update: newFn() },
    product: { findFirst: newFn(), findMany: newFn(), count: newFn(), create: newFn(), update: newFn() },
    category: { findFirst: newFn(), findMany: newFn(), create: newFn(), update: newFn() },
    customer: { findFirst: newFn(), findMany: newFn(), count: newFn(), create: newFn(), update: newFn() },
    supplier: { findFirst: newFn(), findMany: newFn(), count: newFn(), create: newFn(), update: newFn() },
    branch: { findFirst: newFn(), findMany: newFn(), create: newFn(), update: newFn() },
    warehouse: { findFirst: newFn(), findMany: newFn(), create: newFn(), update: newFn() },
    cashRegister: { findFirst: newFn(), findMany: newFn(), create: newFn(), update: newFn() },
    cashMovement: { findFirst: newFn(), findMany: newFn(), create: newFn() },
    invoicePayment: { create: newFn(), aggregate: newFn(), findMany: newFn() },
    invoiceItem: { deleteMany: newFn() },
    stockMovement: { create: newFn() },
    user: { findFirst: newFn(), findMany: newFn(), create: newFn(), update: newFn(), findUnique: newFn() },
    role: { findFirst: newFn(), findMany: newFn(), create: newFn(), update: newFn(), delete: newFn(), findUnique: newFn() },
    permission: { findMany: newFn() },
    userRole: { findUnique: newFn(), create: newFn(), delete: newFn(), count: newFn() },
    rolePermission: { deleteMany: newFn(), createMany: newFn() },
    documentSequence: { findUnique: newFn(), update: newFn() },
    refreshToken: { findFirst: newFn(), create: newFn(), update: newFn() },
  }

  // $transaction: execute callback with mockPrisma as the tx client
  const txMock = fn()
  txMock.mockImplementation((cb: (tx: Record<string, any>) => any) => cb(mockPrisma))
  mockPrisma.$transaction = txMock

  return mockPrisma
}

// Helper: create a mock Fastify request (useful for route tests later).
export function createMockRequest(overrides?: Record<string, unknown>) {
  return {
    tenantId: "test-tenant-id",
    userId: "test-user-id",
    cookies: { access_token: "test-token" },
    routeOptions: { config: {} },
    ...overrides,
  } as any
}

// Helper: mock Decimal values coming from Prisma.
export function mockDecimal(value: number) {
  return { toString: () => String(value), toNumber: () => value } as any
}
