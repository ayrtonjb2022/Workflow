# Database Schema Specification

## Purpose

Define the Prisma v1 schema covering all business entities with mandatory multi-tenant isolation via `tenant_id`, and produce the initial migration.

## Requirements

### Requirement: Tenant-Aware Entities

Every business table MUST include a non-null `tenant_id` column referencing the `tenants` table and MUST be indexed for tenant-scoped queries.

#### Scenario: Tenant foreign key

- GIVEN a Prisma model for `Customer`, `Invoice`, or `Product`
- WHEN inspecting its schema
- THEN it MUST declare `tenantId String @map("tenant_id")` and `tenant Tenant @relation(fields: [tenantId], references: [id])`
- AND a compound index `(tenant_id, id)` MUST exist

#### Scenario: Insert without tenant_id

- GIVEN an insert attempt on a business table
- WHEN `tenant_id` is omitted
- THEN Prisma MUST reject the operation with a not-null constraint violation

### Requirement: V1 Entity Catalog

The schema MUST define at minimum these models: `Tenant`, `User`, `Role`, `Customer`, `Invoice`, `InvoiceLineItem`, `Product`, `ProductCategory`, `Supplier`, `PurchaseOrder`.

#### Scenario: Required fields

- GIVEN each entity
- WHEN created
- THEN all columns annotated with `@updatedAt` and relations marked `@relation` in the Prisma schema MUST be present

#### Scenario: Enum types

- GIVEN status fields on `Invoice` (draft, sent, paid, cancelled) and `PurchaseOrder` (pending, approved, received, cancelled)
- WHEN the Prisma schema is generated
- THEN they MUST be defined using `enum InvoiceStatus` and `enum PurchaseOrderStatus`

### Requirement: Supplier Model Fields

The Supplier model MUST include: id (String, @id @default(cuid())), tenantId (String @map("tenant_id")), name (String), email (String?), phone (String?), documentType (DocumentType? from the DocumentType enum), documentNumber (String?), address (String?), active (Boolean @default(true)), createdAt (DateTime @default(now()) @map("created_at")), updatedAt (DateTime @updatedAt @map("updated_at")). The model MUST include a tenant relation with `@@index([tenantId])` and `@@index([tenantId, name])`.

#### Scenario: Schema compile

- GIVEN the Prisma schema after adding the Supplier model
- WHEN `prisma generate` runs
- THEN no errors occur and the Supplier model is available in the generated client

#### Scenario: Migration

- GIVEN the Prisma schema with the Supplier model
- WHEN `prisma migrate dev` runs
- THEN an AddSupplier migration is created with no destructive changes to existing tables

#### Scenario: Supplier creation

- GIVEN valid supplier data
- WHEN a supplier is created via Prisma
- THEN all fields are stored correctly and tenantId is required

#### Scenario: Unique email across tenants

- GIVEN a supplier with a given email in one tenant
- WHEN a second supplier with the same email is created in a different tenant
- THEN both suppliers are created successfully (email uniqueness is enforced at the application layer, not the database layer)

### Requirement: Initial Migration

The project MUST produce a Prisma migration that creates all v1 tables in a single transaction.

#### Scenario: Fresh database apply

- GIVEN an empty PostgreSQL 16 database
- WHEN `prisma migrate dev --name init` runs
- THEN all tables, indexes, enums, and foreign keys MUST be created without errors

#### Scenario: Idempotent check

- GIVEN the migration has already run
- WHEN `prisma migrate dev` runs again
- THEN Prisma MUST report "already applied" and not modify the schema
