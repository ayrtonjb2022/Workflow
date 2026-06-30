# Tenant Context Specification

**Domain**: `tenant-context`

## Purpose

Ensure every authenticated request carries a tenant context. The tenant is auto-created on registration, and a middleware extracts `tenantId` from the JWT cookie and attaches it to the Fastify request.

## Requirements

### Requirement: Tenant Auto-Creation on Registration

When a user registers via `/auth/register`, the system MUST create a new Tenant entity with the provided `companyName`. The tenant MUST be persisted before the user is created, and the user MUST reference the new tenant.

**Affected domain**: tenant-context

#### Scenario: Registration creates tenant

- GIVEN a new user registers with `companyName: "Acme Corp"`
- WHEN the registration process completes
- THEN a Tenant with `name: "Acme Corp"` is created in the database
- AND the new user has `tenantId` referencing that tenant

### Requirement: Tenant Middleware Extraction

A Fastify middleware/hook MUST extract the `tenantId` from the JWT access token stored in the HTTP-only cookie. The extracted `tenantId` MUST be attached to `request.tenantId`.

**Affected domain**: tenant-context

#### Scenario: Valid token attaches tenantId

- GIVEN an authenticated request with a valid JWT cookie containing `tenantId: "tenant-123"`
- WHEN the request reaches the tenant middleware
- THEN `request.tenantId` is set to `"tenant-123"`
- AND the request proceeds to the route handler

#### Scenario: Missing or invalid token

- GIVEN a request WITHOUT a valid JWT cookie
- WHEN the request reaches the tenant middleware
- THEN the system MUST return `401 Unauthorized`
- AND the request MUST NOT proceed to the route handler

### Requirement: Tenant Context in All Handlers

The system MUST reject any request that reaches a route handler without `request.tenantId` set. All tenant-scoped queries MUST filter by `request.tenantId`.

**Affected domain**: tenant-context

#### Scenario: Block request without tenant context

- GIVEN a request somehow bypasses middleware (e.g., internal error)
- WHEN a route handler receives a request without `tenantId`
- THEN the handler MUST return `500 Internal Server Error`
- AND NOT execute any database operation that depends on tenant scope
