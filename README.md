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
├── src/
│   ├── main.ts                          # Entry point
│   ├── employees.module.ts              # Root NestJS module
│   ├── config/
│   │   └── app.config.ts                # Configuration
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
│           │   │   ├── DateOfBirth.ts
│           │   │   └── *.spec.ts                   
│           │   └── shared/
│           │       ├── clock.ts         
│           │       └── result.ts        
│           │
│           ├── application/             
│           │   └── use-cases/
│           │       ├── commands/
│           │       │   └── create-employee/
│           │       │       ├── createEmployeeCommandHandler.ts
│           │       │       └── createEmployeeCommandHandler.spec.ts
│           │       └── queries/         
│           │
│           └── infrastructure/          
│               ├── adapters/driven/
│               │   ├── SqlServerEmployeeRepository.ts
│               │   ├── sqlServerEmployeeRepository.spec.ts
│               │   └── dateClock.ts
│               ├── database/           # migrations database for environment            
│               │   ├── config.ts
│               │   ├── connection.ts
│               │   ├── migrationRunner.ts
│               │   ├── runMigrations.ts
│               │   └── migrations/
│               │       └── 001_create_workers_table.ts
│               └── endpoints/
│                   ├── employee.controller.ts
│                   └── employee.artifact-spec.ts   # artifact test
│
├── testhelpers/                         # Shared test infrastructure
│   └── base/
│       ├── artifact-test.base.ts        # artifact test base (NestJS + TestContainer)
│       ├── testcontainer-setup.ts       # Testcontainers setup (MSSQL)
│       └── testContainerSettings.json
│
├── vitest.config.ts                     # Vitest configuration
├── nest-cli.json                        # NestJS CLI configuration
├── tsconfig.json                        # TypeScript configuration
├── package.json
├── pnpm-lock.yaml
├── docker-compose.yml                   # MSSQL 2022 for local development
├── eslint.config.mjs                    # ESLint flat config
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
- Mocks via `vi.fn()` to isolate the application layer from the real repository.

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
