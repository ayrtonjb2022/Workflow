# Auth Guard Specification

**Domain**: `auth-guard`

## Purpose

Provide a Fastify plugin/hook that validates whether the authenticated user has the required permission to access a route. Returns 401 for unauthenticated requests and 403 for unauthorized ones.

## Requirements

### Requirement: Permission Guard Hook

The system MUST provide a Fastify `preHandler` hook that accepts one or more required permission strings. The hook MUST inspect the authenticated user's roles, collect all role permissions, and compare against the required permission.

**Affected domain**: auth-guard

#### Scenario: User with permission passes

- GIVEN an authenticated user with `editor` role that includes `invoices:read`
- WHEN the user accesses a route decorated with `requiredPermission: "invoices:read"`
- THEN the request proceeds to the route handler
- AND the response status is `200 OK`

#### Scenario: User without permission fails

- GIVEN an authenticated user with `viewer` role that does NOT include `invoices:delete`
- WHEN the user accesses a route decorated with `requiredPermission: "invoices:delete"`
- THEN the system MUST return `403 Forbidden`

#### Scenario: Unauthenticated request fails

- GIVEN a request WITHOUT a valid JWT cookie
- WHEN the request reaches a route decorated with any `requiredPermission`
- THEN the system MUST return `401 Unauthorized`
- AND NOT check permissions

### Requirement: Role-Inherited Permissions

The guard MUST evaluate the UNION of permissions from all roles assigned to the user. If ANY role grants the required permission, the check passes.

**Affected domain**: auth-guard

#### Scenario: Permission from any role passes

- GIVEN a user has roles [viewer, editor] where viewer has `reports:read` and editor has `invoices:create`
- WHEN the user accesses a route with `requiredPermission: "reports:read"`
- THEN the check passes (permission granted via the `viewer` role)
- AND the request proceeds

#### Scenario: No role grants permission

- GIVEN a user has roles [viewer] with permissions [`reports:read`]
- WHEN the user accesses a route with `requiredPermission: "invoices:create"`
- THEN the guard returns `403 Forbidden`
- AND the route handler is NOT executed
