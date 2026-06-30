# Permission System Specification

**Domain**: `permission-system`

## Purpose

Define system-level permissions using the format `resource:action` (e.g., `users:create`, `invoices:read`). Permissions are assigned to roles, which are then assigned to users. Permissions are system-defined and seeded, not created at runtime.

## Requirements

### Requirement: Permission Format

Every permission MUST use the format `{resource}:{action}`. Resources are domain entities (e.g., `users`, `invoices`, `roles`). Actions are verbs (e.g., `create`, `read`, `update`, `delete`, `manage`).

**Affected domain**: permission-system

#### Scenario: Valid permission format

- GIVEN the system is seeded
- THEN permissions like `users:create`, `invoices:read`, `roles:manage` exist
- AND each permission has an `id`, `resource`, and `action` field

### Requirement: List All Permissions

Any authenticated user MAY list all system-defined permissions. The list MUST be the same for all tenants.

**Affected domain**: permission-system

#### Scenario: List permissions

- GIVEN an authenticated user
- WHEN they GET `/permissions`
- THEN the response includes all system-defined permissions
- AND the list is identical across tenants

### Requirement: Grant Permission to Role

An admin MUST be able to grant a permission to a role. The permission MUST already exist in the system.

**Affected domain**: permission-system

#### Scenario: Grant existing permission

- GIVEN a role `editor` and a permission `users:create` exists
- WHEN an admin grants `users:create` to the `editor` role
- THEN the role `editor` now includes the `users:create` permission

#### Scenario: Grant non-existent permission

- GIVEN a role `editor`
- WHEN an admin tries to grant a permission `invoices:fly` that does NOT exist in the system
- THEN the system MUST return `404 Not Found`

### Requirement: Revoke Permission from Role

An admin MUST be able to revoke a permission from a role.

**Affected domain**: permission-system

#### Scenario: Revoke permission

- GIVEN a role `editor` has permissions [`users:create`, `users:read`]
- WHEN an admin revokes `users:create` from the role
- THEN the role `editor` now has only [`users:read`]

### Requirement: Check User Permission

The system MUST be able to check whether a user has a specific permission by traversing user → roles → permissions.

**Affected domain**: permission-system

#### Scenario: User has permission via role

- GIVEN a user has the `editor` role which includes `invoices:read`
- WHEN the system checks if the user has `invoices:read`
- THEN the result is `true`

#### Scenario: User does not have permission

- GIVEN a user has the `viewer` role which does NOT include `invoices:delete`
- WHEN the system checks if the user has `invoices:delete`
- THEN the result is `false`
