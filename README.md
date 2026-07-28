# HomeCareApi

REST API for managing home care employees. Built with **NestJS** + **TypeScript**, following **Domain-Driven Design (DDD)** and **Hexagonal Architecture (Ports & Adapters)** principles.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime environment |
| TypeScript | ^5.7 | Language |
| NestJS | ^11.0 | Web framework |
| mssql | ^9.1 | SQL Server client |
| SWC | ^1.15 | Fast TypeScript/JS compiler |
| Vitest | ^4.0 | Test runner |
| Testcontainers | ^11.8 | Docker containers for integration tests |
| Supertest | ^7.0 | HTTP assertions for E2E tests |
| OpenTelemetry | ^1.22 | Observability (traces, metrics, logs) |
| Docker Compose | - | MSSQL 2022 + app for local development |

## Folder Structure

```
HomeCareApi/
├── .github/
│   └── workflows/
│       └── pr.yml                       # CI pipeline on pull request
├── src/
│   ├── main.ts                          # Entry point
│   ├── employees.module.ts              # Root NestJS module
│   ├── config/
│   │   └── app.config.ts               
│   ├── database/                       
│   │   ├── config.ts
│   │   ├── connection.ts
│   │   ├── IMigration.ts
│   │   ├── migrationRunner.ts
│   │   ├── runMigrations.ts
│   │   └── migrations/
│   │       ├── 001_create_workers_table.ts
│   │       └── 002_create_outbox_tables.ts
│   └── modules/
│       └── employees/                   # Bounded context
│           ├── domain/                  # Domain layer
│           │   ├── employee.ts          # Employee aggregate root
│           │   ├── repositories/
│           │   │   └── employee.repository.ts
│           │   ├── value-objects/
│           │   │   ├── EmployeeId.ts
│           │   │   ├── Name.ts
│           │   │   ├── DocumentNumber.ts
│           │   │   └── DateOfBirth.ts
│           │   ├── events/
│           │   │   └── EmployeeCreatedV1.ts
│           │   └── shared/
│           │       ├── clock.ts
│           │       ├── domainevent.ts
│           │       ├── result.ts
│           │       └── utils.ts
│           │
│           ├── application/
│           │   ├── create-employee/
│           │   │   └── createEmployeeCommandHandler.ts
│           │   └── ports/
│           │       ├── outbox.repository.ts
│           │       └── unitofwork.ts
│           │
│           └── infrastructure/
│               ├── adapters/
│               │   ├── SqlServerEmployeeRepository.ts
│               │   ├── SqlServerOutboxRepository.ts
│               │   ├── sqlServerUnitOfWork.ts
│               │   └── dateClock.ts
│               └── restapi/
│                   └── create-employee/
│                       └── employee.controller.ts
│
├── tests/                               
│   ├── base/
│   │   ├── artifact-test.base.ts
│   │   ├── testcontainer-setup.ts
│   │   └── testContainerSettings.json
│   └── modules/
│       └── employees/
│           ├── application/
│           │   └── create-employee/
│           │       ├── createEmployeeCommandHandler.spec.ts
│           │       ├── createEmployeeCommandHandlerFake.spec.ts
│           │       └── EmployeeInMemoryRepository.ts
│           ├── domain/
│           │   ├── EmployeeId.spec.ts
│           │   ├── Name.spec.ts
│           │   ├── DocumentNumber.spec.ts
│           │   └── DateOfBirth.spec.ts
│           └── infrastructure/
│               ├── narrow/
│               │   ├── sqlServerEmployeeRepository.spec.ts
│               │   └── employee.controller.spec.ts
│               ├── artifact/
│               │   └── create-an-employee.artifact-spec.ts
│               └── stubs/
│                   └── dateClockStub.ts
│
├── vitest.config.ts                     # Vitest configuration
├── nest-cli.json                        # NestJS CLI configuration
├── tsconfig.json                        # TypeScript configuration
├── tsconfig.build.json                  # TypeScript build configuration
├── package.json
├── pnpm-lock.yaml
├── docker-compose.yml                   # MSSQL 2022 + app for local development
├── eslint.config.mjs                    # ESLint flat config
├── .prettierrc                          # Prettier config
└── .env.example                         # Environment variable template
```

## Architecture

The project follows **Domain-Driven Design (DDD)** with **Hexagonal Architecture** across 3 layers:

### Outbox Pattern

Domain events are persisted using the **Outbox Pattern** to guarantee atomicity between domain state changes and event publication. When an aggregate changes, the resulting domain event is stored in the `outboxMessages` table within the same transaction as the business data. A background process (not yet implemented) will poll the outbox and dispatch events to downstream consumers.

This ensures **at-least-once delivery** and avoids the dual-write problem without relying on distributed transactions.

| Component | File | Description |
|-----------|------|-------------|
| `OutboxRepository` | `src/modules/employees/application/ports/outbox.repository.ts` | Port (interface) for persisting domain events |
| `SqlServerOutboxRepository` | `src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository.ts` | SQL Server implementation of the outbox port |
| `EmployeeCreatedV1` | `src/modules/employees/domain/events/EmployeeCreatedV1.ts` | Domain event emitted when an employee is created |
| `outboxMessages` table | `src/database/migrations/002_create_outbox_tables.ts` | Migration that creates the outbox table |

**Flow:**
1. `CreateEmployeeCommandHandler` creates the `Employee` aggregate
2. Domain events are pulled from the aggregate via `pullDomainEvents()`
3. Each event is saved to `outboxMessages` and the employee is persisted — both inside the same `UnitOfWork` transaction
4. A future dispatcher will read unprocessed messages and publish them

## Testing

### Framework: **Vitest** v4.0

Testing strategy: 
```
https://miro.com/app/board/uXjVHCdydrQ=/
```

| Type | Description |
|------|-------------|
| **Unit** | Validates Value Objects and Command Handlers in isolation using mocked dependencies. — fast, no dependencies |
| **Social Unit** | Application layer tested with `InMemoryRepository` fake |
| **Narrow Integration** | Repository and Controller tested against real dependencies (API / TestContainer) |
| **Contract** | Ensures the fake repository satisfies the same contract as the real one |
| **Artifact** | Full HTTP (Supertest) + NestJS + real MSSQL in Docker container |

### Commands

```bash
pnpm test            # Run all tests
pnpm test:artifact        # Only artifact tests (artifact-spec)
```

### Swagger / OpenAPI

Interactive API documentation is available via **Swagger UI** at:

```
http://localhost:3000/swagger
```

Powered by `@nestjs/swagger`. The OpenAPI specification is auto-generated from decorators (`@ApiProperty`, `@ApiOperation`, `@ApiTags`, etc.) and reflects the current state of the API endpoints, request bodies, and response codes.

## Local development requirements

- Node.js >= 18
- pnpm
- Docker (for local MSSQL)

### Quick start

```bash
pnpm install
docker compose up -d    # Start MSSQL 2022 + the app
# Or rely on docker-compose.yml which now starts both services
```