# Docker Dev Environment Specification

## Purpose

Provide Docker Compose orchestration for PostgreSQL 16 and any supporting services needed during development, with persistent storage and environment configuration.

## Requirements

### Requirement: PostgreSQL 16 Container

The Docker Compose file MUST define a PostgreSQL 16 service with persistent data volume and health check.

#### Scenario: Container startup

- GIVEN `docker compose up` runs
- WHEN the PostgreSQL container initialises
- THEN it MUST be reachable on port `5432` with configured user, password, and database

#### Scenario: Data persistence

- GIVEN the PostgreSQL container is stopped with `docker compose down`
- WHEN it is started again with `docker compose up`
- THEN previously created tables and data MUST still exist

#### Scenario: Health check

- GIVEN the Compose file defines a health check
- WHEN `docker compose ps` runs
- THEN dependent services MUST wait for the health check to pass before starting

### Requirement: Service Dependencies

The API service definition MUST declare a dependency on the PostgreSQL service being healthy.

#### Scenario: Startup ordering

- GIVEN `docker compose up` runs
- WHEN the API container starts
- THEN PostgreSQL MUST already be accepting connections

### Requirement: Environment Configuration

Sensitive values MUST be loaded from a `.env` file, not hardcoded in Compose.

#### Scenario: .env loading

- GIVEN a `.env` file with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- WHEN `docker compose --env-file .env config` runs
- THEN the resolved values MUST appear in the output

#### Scenario: Missing .env

- GIVEN no `.env` file exists
- WHEN `docker compose up` runs
- THEN Compose MUST use sensible defaults or fail with a clear message — it MUST NOT use empty passwords
