# API Scaffold Specification

## Purpose

Scaffold the Fastify + TypeBox HTTP server with health check endpoint, error handling, and Prisma client integration — the foundation for all API modules.

## Requirements

### Requirement: Server Startup

The application MUST boot a Fastify server on a configurable port with TypeBox type providers registered.

#### Scenario: Default port

- GIVEN no `PORT` environment variable
- WHEN the server starts
- THEN it MUST listen on port `3001` by default

#### Scenario: Configurable port

- GIVEN `PORT=4000` is set
- WHEN the server starts
- THEN it MUST listen on port `4000`

#### Scenario: Port conflict

- GIVEN the configured port is already in use
- WHEN the server attempts to bind
- THEN it MUST log the error and exit with a non-zero code

### Requirement: Health Check Endpoint

The server MUST expose a `GET /health` endpoint returning service status.

#### Scenario: Healthy response

- GIVEN the server is running and the database is reachable
- WHEN a `GET /health` request is made
- THEN it MUST return HTTP 200 with `{ "status": "ok", "uptime": <number> }`

#### Scenario: Database unreachable

- GIVEN the server is running but the database connection failed
- WHEN a `GET /health` request is made
- THEN it MUST return HTTP 503 with `{ "status": "degraded", "uptime": <number> }`

### Requirement: Prisma Client Integration

The server MUST instantiate a single Prisma client and attach it to the Fastify instance for request-scoped access.

#### Scenario: Client lifecycle

- GIVEN the server starts
- WHEN PrismaClient is instantiated
- THEN it MUST be available via `fastify.prisma` on every request

#### Scenario: Graceful disconnect

- GIVEN the server receives a `SIGTERM` signal
- WHEN shutting down
- THEN `$disconnect()` MUST be called on the Prisma client before the process exits

### Requirement: Response Serialization

All routes MUST use TypeBox schemas for request validation and response serialization.

#### Scenario: Type validation

- GIVEN a request with an invalid body type
- WHEN TypeBox validation fails
- THEN Fastify MUST return HTTP 400 with a structured validation error
