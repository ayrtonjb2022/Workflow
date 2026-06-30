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
