# Permission System Specification

## Purpose

Define the permission model and seed data for role-based access control across all CRM/ERP domains. Permissions follow a `{resource}:{action}` naming convention seeded from a configuration array.

## Requirements

### Requirement: Supplier Permissions

The system MUST include four supplier permissions following the existing `customers:*` pattern: `suppliers:create`, `suppliers:read`, `suppliers:update`, `suppliers:delete`. These SHALL be seeded into the Permission model via the seed script.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Seed run | Permission model exists with customer permissions | `prisma db seed` executes | Four new supplier permissions are created in the Permission table |
| Idempotent | Supplier permissions already seeded | Seed runs again | No duplicate permission rows (upsert by permission key) |
| Route guard | Route configured with requiredPermission: "suppliers:create" | User without that permission calls route | 403 Forbidden |
| Route guard pass | Route configured with requiredPermission: "suppliers:read" | User with suppliers:read calls route | Request proceeds to handler |
