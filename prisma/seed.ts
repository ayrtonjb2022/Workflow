import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const RESOURCES = [
  "users",
  "roles",
  "customers",
  "products",
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

  // Create all permissions
  const permissions = []
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.create({
        data: {
          resource,
          action,
          name: `${resource}:${action}`,
          description: `Can ${action} ${resource}`,
        },
      })
      permissions.push(perm)
    }
  }
  console.log(`Created ${permissions.length} permissions`)

  // Admin role — all permissions
  await prisma.role.create({
    data: {
      name: "admin",
      description: "Full system access",
      isSystem: true,
      rolePermissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  })

  // User role — read-only
  const readPermissions = permissions.filter((p) => p.action === "read")
  await prisma.role.create({
    data: {
      name: "user",
      description: "Basic read access",
      isSystem: true,
      rolePermissions: {
        create: readPermissions.map((p) => ({ permissionId: p.id })),
      },
    },
  })

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
