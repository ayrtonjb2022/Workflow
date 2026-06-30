# User Management Specification

**Domain**: `user-management`

## Purpose

Provide tenant-scoped user CRUD operations. Tenant admins can create, read, update, and deactivate users within their own tenant only.

## Requirements

### Requirement: Create User

An admin MUST be able to create a new user within their own tenant by providing `name`, `email`, `password`, and an optional `roleIds` array. The user MUST belong to the admin's tenant.

**Affected domain**: user-management

#### Scenario: Admin creates user within same tenant

- GIVEN an authenticated admin with role `admin`
- WHEN they POST to `/users` with `name`, `email`, `password`, and `roleIds`
- THEN a new user is created within the admin's tenant
- AND the response is `201 Created` with the user data

#### Scenario: Duplicate email within tenant

- GIVEN a user with email `user@example.com` already exists in the admin's tenant
- WHEN the admin tries to create another user with the same email
- THEN the system MUST return `409 Conflict`

### Requirement: List Users

The system MUST return all users within the requester's tenant. It MUST NOT leak users from other tenants.

**Affected domain**: user-management

#### Scenario: Tenant isolation on list

- GIVEN Tenant A has users [Alice, Bob] and Tenant B has users [Charlie]
- WHEN an admin from Tenant A GETs `/users`
- THEN the response MUST include only Alice and Bob
- AND MUST NOT include Charlie

### Requirement: Get User

The system MUST return a single user by ID, scoped to the requester's tenant.

**Affected domain**: user-management

#### Scenario: Get user from same tenant

- GIVEN a user exists in the requester's tenant
- WHEN they GET `/users/:id`
- THEN the response is `200 OK` with the user data

#### Scenario: Get user from different tenant

- GIVEN a user exists in a DIFFERENT tenant
- WHEN the requester GETs `/users/:id` for that user
- THEN the system MUST return `404 Not Found`

### Requirement: Deactivate User

An admin MUST be able to deactivate a user. A deactivated user MUST NOT be able to log in. An admin MUST NOT be able to deactivate themselves.

**Affected domain**: user-management

#### Scenario: Admin deactivates another user

- GIVEN an admin and another active user in the same tenant
- WHEN the admin deactivates that user
- THEN the user's `active` flag is set to `false`
- AND that user can no longer log in

#### Scenario: Admin tries to deactivate themselves

- GIVEN an authenticated admin
- WHEN they attempt to deactivate their own account
- THEN the system MUST return `400 Bad Request`
