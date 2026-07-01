# Delta for database-schema

## ADDED Requirements

### Requirement: Supplier Model Fields

The Supplier model MUST include: id (String, @id @default(cuid())), tenantId (String @map("tenant_id")), name (String), email (String?), phone (String?), documentType (documentType enum: DNI? | CUIT? | PASSPORT?), documentNumber (String?), address (String?), active (Boolean @default(true)), createdAt (DateTime @default(now()) @map("created_at")), updatedAt (DateTime @updatedAt @map("updated_at")). Tenant relation and compound index (tenantId, id) MUST follow the Tenant-Aware pattern from the existing schema.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Schema compile | Schema after adding Supplier | `prisma generate` runs | No errors, Supplier model in generated client |
| Migration | Schema with Supplier model | `prisma migrate dev` | AddSupplier migration created with no destructive changes to existing tables |
| Supplier creation | Valid data | Supplier created via Prisma | All fields stored correctly, tenantId required |
| Unique email | Supplier with same email in different tenant | Second supplier created | Both succeed (unique per DB, tenant check at app layer) |

(Previously: Supplier was declared in the V1 entity catalog as a model name only, without field definitions.)

## MODIFIED Requirements

### Requirement: V1 Entity Catalog

The schema MUST define at minimum these models: `Tenant`, `User`, `Role`, `Customer`, `Invoice`, `InvoiceLineItem`, `Product`, `ProductCategory`, `Supplier`, `PurchaseOrder`.
(Previously: Same list — no change to catalog, only field definitions added.)

#### Scenario: Required fields

- GIVEN each entity
- WHEN created
- THEN all columns annotated with `@updatedAt` and relations marked `@relation` in the Prisma schema MUST be present
(Unchanged)

#### Scenario: Enum types

- GIVEN status fields on `Invoice` (draft, sent, paid, cancelled) and `PurchaseOrder` (pending, approved, received, cancelled)
- WHEN the Prisma schema is generated
- THEN they MUST be defined using `enum InvoiceStatus` and `enum PurchaseOrderStatus`
(Unchanged)
