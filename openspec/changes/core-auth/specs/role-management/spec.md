# Role Management Specification

**Domain**: `role-management`

## Purpose

Enable tenant-scoped role CRUD, permission assignment, and user-role management. Admins create roles with granular permission sets.

## Requirements

### Requirement: Create Role

An admin MUST be able to create a role with a `name` and an optional set of `permissionIds` within their tenant.

**Affected domain**: role-management

#### Scenario: Create role with permissions

- GIVEN an authenticated admin
- WHEN they POST to `/roles` with `name: "editor"` and `permissionIds: [1, 2, 3]`
- THEN a new role is created within the admin's tenant
- AND the role has permissions with IDs 1, 2, and 3

#### Scenario: Create role with no permissions

- GIVEN an authenticated admin
- WHEN they POST to `/roles` with `name: "viewer"` and no `permissionIds`
- THEN the role is created successfully with an empty permission set
- AND the response is `201 Created`

### Requirement: Assign Role to User

An admin MUST be able to assign one or more roles to a user within their tenant.

**Affected domain**: role-management

#### Scenario: Assign multiple roles to user

- GIVEN a user in the admin's tenant and two existing roles `editor` and `viewer`
- WHEN the admin assigns both roles to the user
- THEN the user has both `editor` and `viewer` roles
- AND the user inherits the union of both roles' permissions

### Requirement: Remove Role from User

An admin MUST be able to remove a role from a user. The system MUST prevent removing the last `admin` role from a tenant's last admin user.

**Affected domain**: role-management

#### Scenario: Remove last admin role

- GIVEN a tenant has exactly ONE user with the `admin` role and no other admin users
- WHEN an admin attempts to remove the `admin` role from that user
- THEN the system MUST return `400 Bad Request`
- AND the role MUST NOT be removed

#### Scenario: Remove non-admin role successfully

- GIVEN a user has the `editor` role
- WHEN an admin removes the `editor` role from that user
- THEN the role is removed successfully
- AND the response is `200 OK`

### Requirement: List Roles

The system MUST return all roles within the requester's tenant.

**Affected domain**: role-management

#### Scenario: List roles scoped to tenant

- GIVEN Tenant A has roles [admin, editor] and Tenant B has roles [admin, viewer]
- WHEN an admin from Tenant A GETs `/roles`
- THEN the response includes only `admin` and `editor`
- AND does NOT include `viewer`
