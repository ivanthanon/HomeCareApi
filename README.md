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
| Docker Compose | - | MSSQL 2022 for local development |

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
│   │       └── 001_create_workers_table.ts
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
│           │   └── shared/
│           │       ├── clock.ts
│           │       ├── result.ts
│           │       └── utils.ts
│           │
│           ├── application/
│           │   └── create-employee/
│           │       └── createEmployeeCommandHandler.ts
│           │
│           └── infrastructure/
│               ├── adapters/
│               │   ├── SqlServerEmployeeRepository.ts
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
├── docker-compose.yml                   # MSSQL 2022 for local development
├── eslint.config.mjs                    # ESLint flat config
├── .prettierrc                          # Prettier config
└── .env.example                         # Environment variable template
```

## Architecture

The project follows **Domain-Driven Design (DDD)** with **Hexagonal Architecture** across 3 layers:

## Testing

### Framework: **Vitest** v4.0

Three types of tests are used:

| Type | Pattern | Description |
|------|---------|-------------|
| **Unit** | `*.spec.ts` | Value Object validation and use case logic with mocks |
| **Integration** | `*.spec.ts` | Repository against real MSSQL via Testcontainers |
| **Artifact / Acceptance** | `*.artifact-spec.ts` | Full HTTP (Supertest) + NestJS + real MSSQL in Docker container |

### Commands

```bash
pnpm test            # Run all tests
pnpm test:artifact        # Only artifact tests (artifact-spec)
```

### Test infrastructure

- **Testcontainers** spins up a real MSSQL 2019 container for integration and E2E tests.
- `DateClockStub` allows controlling time in tests that depend on the current date.
- Mocks via `MockProxy<EmployeeRepository>` to isolate the application layer from the real repository.
- Fake via `EmployeeInMemoryRepository` to isolate the application layer from the real repository.

## API

| Method | Path | Description | Status codes |
|--------|------|-------------|--------------|
| `POST` | `/employees` | Create an employee | `201` OK, `400` validation error |

### Example body

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Juan",
  "lastName": "Pérez",
  "documentNumber": "12345678A",
  "dateOfBirth": "1990-05-15"
}
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
docker compose up -d    # Start MSSQL 2022
pnpm run start:dev      # Start development server
```