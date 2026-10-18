# HomeCareApi

REST API for managing home care employees. Built with **NestJS** + **TypeScript**, following **Domain-Driven Design (DDD)** and **Hexagonal Architecture (Ports & Adapters)** principles.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 26 | Runtime environment |
| TypeScript | ~6.0 | Language |
| NestJS | ^12.1 | Web framework |
| mssql | ^12.7 | SQL Server client |
| SWC | ^1.16 | Fast TypeScript/JS compiler |
| Vitest | ^5.0 | Test runner |
| Testcontainers | ^12.2 | Docker containers for integration tests |
| Supertest | ^7.0 | HTTP assertions for E2E tests |
| OpenTelemetry | ^1.22 | Observability (traces, metrics, logs) |
| Docker Compose | - | MSSQL 2022 + app + Grafana LGTM stack for local development |

## Agent onboarding

Read [AGENTS.md](AGENTS.md) for the architecture, CodeGraph-first navigation, and artifact-first testing workflow. `AGENTS.md` and `.codegraph/.gitignore` are tracked; the CodeGraph index in `.codegraph/`, the `.atl/` registry, and `odd/` task progress are local/ignored. Do not commit generated or machine-specific agent state.

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
│           │       └── transactionScope.ts
│           │
│           └── infrastructure/
│               ├── adapters/
│               │   ├── SqlServerEmployeeRepository.ts
│               │   ├── SqlServerOutboxRepository.ts
│               │   ├── sqlServerTransactionScope.ts
│               │   └── dateClock.ts
│               └── restapi/
│                   └── create-employee/
│                       └── employee.controller.ts
│
├── tests/                               
│   ├── base/
│   │   ├── artifact-test.base.ts
│   │   ├── testcontainer-setup.ts
│   │   ├── test.config.json
│   │   └── testContainerSettings.json
│   ├── doubles/
│   │   ├── fake/
│   │   │   ├── EmployeeInMemoryRepository.ts
│   │   │   └── OutboxInMemoryRepository.ts
│   │   └── stub/
│   │       └── dateClockStub.ts
│   ├── helpers/
│   │   └── assert/
│   │       └── OutboxTestHelper.ts
│   └── modules/
│       └── employees/
│           ├── domain/
│           │   ├── Employee.spec.ts
│           │   └── valueobjects/
│           │       ├── EmployeeId.spec.ts
│           │       ├── Name.spec.ts
│           │       ├── DocumentNumber.spec.ts
│           │       └── DateOfBirth.spec.ts
│           ├── application/
│           │   └── create-employee/
│           │       └── createEmployeeCommandHandler.spec.ts
│           └── infrastructure/
│               ├── narrow/
│               │   ├── sqlServerEmployeeRepository.spec.ts
│               │   ├── sqlServerOutboxRepository.spec.ts
│               │   ├── sqlServerTransactionScope.spec.ts
│               │   └── employee.controller.spec.ts
│               ├── contract/
│               │   ├── Employee/
│               │   │   ├── EmployeeRepositoryContractTest.ts
│               │   │   ├── InMemoryEmployeeRepositoryContract.spec.ts
│               │   │   └── SqlServerEmployeeRepositoryContract.spec.ts
│               │   └── outbox/
│               │       ├── OutboxRepositoryContractTest.ts
│               │       ├── InMemoryOutboxRepositoryContract.spec.ts
│               │       └── SqlServerOutboxRepositoryContract.spec.ts
│               └── artifact/
│                   └── create-an-employee.artifact-spec.ts
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
| `TransactionScope` | `src/modules/employees/application/ports/transactionScope.ts` | Port (interface) for transactional execution |
| `SqlServerTransactionScope` | `src/modules/employees/infrastructure/adapters/sqlServerTransactionScope.ts` | SQL Server implementation of transaction scope |
| `EmployeeCreatedV1` | `src/modules/employees/domain/events/EmployeeCreatedV1.ts` | Domain event emitted when an employee is created |
| `outboxMessages` table | `src/database/migrations/002_create_outbox_tables.ts` | Migration that creates the outbox table |

**Flow:**
1. `CreateEmployeeCommandHandler` creates the `Employee` aggregate
2. Domain events are pulled from the aggregate via `pullDomainEvents()`
3. Each event is saved to `outboxMessages` and the employee is persisted — both inside the same `TransactionScope` execution
4. A future dispatcher will read unprocessed messages and publish them

## Testing

**Vitest v5.** For new features, start with a failing HTTP artifact acceptance test (`*.artifact-spec.ts`) using the booted Nest app and real SQL Server through `tests/base/artifact-test.base.ts`. Arrange persisted preconditions with direct SQL, then implement inward through controller, application, and domain until positive HTTP behavior, use-case outcomes, and persistence are covered. Run artifact tests at checkpoints and after implementation.

Add controller contract tests (`tests/modules/.../infrastructure/narrow/*controller.spec.ts`) only for missing, malformed, or wrongly typed HTTP inputs. Keep business validation and success/not-found outcomes in artifact tests. Existing unit, social-unit, narrow adapter, and repository contract tests remain in the tree, but do not add new lower-level feature tests unless explicitly requested. See [AGENTS.md](AGENTS.md#testing-rules) for detailed test conventions.

### Commands

```bash
pnpm test            # All tests, including artifact tests (Docker required)
pnpm test:unit       # Existing non-artifact tests (no Docker needed)
pnpm test:artifact   # Artifact tests only (Docker required)
```

Artifact tests use Testcontainers and need a working Docker daemon; `test:unit` excludes `*.artifact-spec.ts` and cannot substitute for artifact acceptance.

### Swagger / OpenAPI

Interactive API documentation is available via **Swagger UI** at:

```
http://localhost:3007/swagger
```

Powered by `@nestjs/swagger`. The OpenAPI specification is auto-generated from decorators (`@ApiProperty`, `@ApiOperation`, `@ApiTags`, etc.) and reflects the current state of the API endpoints, request bodies, and response codes.

## Local development requirements

- Node.js >= 26
- pnpm
- Docker (for local MSSQL)

### Quick start

```bash
pnpm install
docker compose up -d    # Start MSSQL 2022 + the app
# Or rely on docker-compose.yml which now starts both services
```
