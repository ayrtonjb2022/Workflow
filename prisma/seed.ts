import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const RESOURCES = [
  "users",
  "roles",
  "customers",
  "suppliers",
  "products",
  "categories",
  "invoices",
  "quotes",
  "orders",
  "cash",
  "reports",
  "settings",
] as const

const ACTIONS = ["create", "read", "update", "delete"] as const

async function main() {
  console.log("Seeding permissions and roles...")

  // Create system tenant for default roles (idempotent)
  const systemTenant = await prisma.tenant.upsert({
    where: { slug: "system" },
    update: {},
    create: {
      name: "System",
      slug: "system",
    },
  })
  console.log("System tenant:", systemTenant.id)

  // Create all permissions (idempotent)
  const permissions = []
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const name = `${resource}:${action}`
      const perm = await prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          resource,
          action,
          name,
          description: `Can ${action} ${resource}`,
        },
      })
      permissions.push(perm)
    }
  }
  console.log(`Ensured ${permissions.length} permissions`)

  // Admin role — all permissions (idempotent)
  await prisma.role.upsert({
    where: {
      tenantId_name: { tenantId: systemTenant.id, name: "admin" },
    },
    update: {
      rolePermissions: {
        deleteMany: {},
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
    create: {
      name: "admin",
      description: "Full system access",
      isSystem: true,
      tenantId: systemTenant.id,
      rolePermissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  })

  // User role — read-only (idempotent)
  const readPermissions = permissions.filter((p) => p.action === "read")
  await prisma.role.upsert({
    where: {
      tenantId_name: { tenantId: systemTenant.id, name: "user" },
    },
    update: {
      rolePermissions: {
        deleteMany: {},
        create: readPermissions.map((p) => ({ permissionId: p.id })),
      },
    },
    create: {
      name: "user",
      description: "Basic read access",
      isSystem: true,
      tenantId: systemTenant.id,
      rolePermissions: {
        create: readPermissions.map((p) => ({ permissionId: p.id })),
      },
    },
  })

  // Create default categories (idempotent)
  const defaultCategories = [
    { name: "General", description: "Productos generales" },
    { name: "Servicios", description: "Servicios profesionales" },
    { name: "Materia Prima", description: "Insumos y materiales" },
    { name: "Productos Terminados", description: "Productos listos para venta" },
  ]
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: {
        tenantId_name: { tenantId: systemTenant.id, name: cat.name },
      },
      update: {},
      create: {
        tenantId: systemTenant.id,
        name: cat.name,
        description: cat.description,
      },
    })
  }
  console.log(`Ensured ${defaultCategories.length} default categories`)

  console.log("Created default roles: admin, user")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
