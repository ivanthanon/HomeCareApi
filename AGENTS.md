# AGENTS.md

Guidance for agents working in this repository.

## Project

REST API for managing home care employees. **NestJS** + **TypeScript**, structured as **Domain-Driven Design (DDD)** with **Hexagonal Architecture (Ports & Adapters)**.

- Package manager: **pnpm** (do not use npm/yarn; lockfile is `pnpm-lock.yaml`).
- Runtime: Node.js >= 18 (CI uses Node 24). DB: SQL Server via `mssql`.

## Commands

```bash
pnpm install            # install deps
pnpm build              # nest build (also the TypeScript check)
pnpm lint               # eslint --fix on src/tests
pnpm format             # prettier --write on src/tests
pnpm test               # all tests (unit + narrow + contract + artifact)
pnpm test:unit          # everything except artifact-spec (no Docker needed)
pnpm test:artifact      # only artifact-spec (Docker needed)
pnpm migration:up       # apply DB migrations
pnpm migration:down     # revert last migration
```

CI (`.github/workflows/pr.yml`) runs `pnpm build` then `pnpm test` on PRs to `main`. Both must pass.

## Architecture rules

Bounded context lives under `src/modules/<context>/`. Keep the dependency direction **inward only**:

```
infrastructure  →  application  →  domain
```

The **domain must never import** from `application` or `infrastructure`, and must not depend on NestJS or `mssql`.

### Domain (`src/modules/employees/domain`)

- **Aggregate roots** (`employee.ts`): lowercase entity file names. Expose static `create(...)` that validates via Value Objects and pushes domain events, and static `reconstitute(...)` that rebuilds from persisted data **without validation**. Drain events with `pullDomainEvents()`.
- **Value Objects** (`value-objects/Name.ts`, `EmployeeId.ts`, ...): PascalCase file names, one class per file, expose `readonly value`, a public unchecked constructor, and a static `create(...)` returning `Result<VO, Error>`.
- **Result over exceptions**: expected validation failures return `Result<T, Error>` (`domain/shared/result.ts`, `Ok`/`Err`). Check `result.success === false` and return the error; do **not** throw for domain validation. Reserve `throw` for programming/config errors (e.g. missing config).
- **Domain events** (`domain/events/*.ts`): implement `DomainEvent` (`eventName` + `occurredOn`). Version the event name (`EmployeeCreated.v1`).
- **Repository interfaces** live in domain (`domain/repositories/`) and use only domain types.
- **Time is injected**: never call `new Date()` inside the domain. Depend on the `Clock` port (`domain/shared/clock.ts`).

### Application (`src/modules/employees/application`)

- One folder per use case (e.g. `create-employee/`), containing a `CreateEmployeeCommand` + `CreateEmployeeCommandHandler` (camelCase file).
- **Ports** are interfaces (`application/ports/`): e.g. `OutboxRepository`, `TransactionScope`.
- The handler orchestrates: idempotency check → build aggregate → run inside `TransactionScope` → persist aggregate + outbox events. Keep handlers free of framework/HTTP concerns.

### Infrastructure (`src/modules/employees/infrastructure`)

- **Adapters** (`adapters/`) implement application/domain ports (`SqlServer*`). SQL Server access goes through `SqlServerTransactionScope.getRequest()`; adapters never open their own pool.
- **REST** (`restapi/*/…controller.ts`): NestJS controllers, Swagger decorators (`@ApiTags`, `@ApiProperty`, ...). Controllers translate HTTP ↔ command and map `Result` failures to `BadRequestException`. No business logic here.
- **Composition root**: wire concrete adapters in `src/employees.module.ts` with explicit factory providers. Register dependencies there, not with decorators inside the layers.

### Cross-cutting

- **Outbox pattern**: domain events are persisted to `outboxMessages` in the **same transaction** as the aggregate (guarantees atomicity, at-least-once delivery). New domain events must also be routed to the outbox.
- **Migrations** (`src/database/migrations/`): numbered `NNN_description.ts`, export a `migration: IMigration` with `up`/`down`, idempotent (`IF NOT EXISTS`). `up` and `down` must stay symmetric.

## Code style

- Prettier: `singleQuote: true`, `trailingComma: all`. ESLint flat config (`eslint.config.mjs`).
- **Keep formatting changes scoped**: do not reformat or adjust indentation/whitespace in unrelated existing code. Format only changed lines or files when needed; avoid noisy formatting-only diffs.
- Prefer `Result` and explicit types at layer boundaries.
- Imports may use the `src/`, `tests/`, `@/` aliases (see `vitest.config.ts`) or relative paths; follow the surrounding file.
- Do not add comments unless they carry non-obvious intent.

## Testing rules

Runner: **Vitest v4** (`vitest.config.ts`, globals enabled, node environment). Test files are `*.spec.ts` (unit/narrow/contract) or `*.artifact-spec.ts` (E2E). Tests mirror the source path under `tests/`.

### Test strategy

| Level | Location | Dependencies | Purpose |
|-------|----------|--------------|---------|
| **Artifact (E2E)** | `tests/modules/.../infrastructure/artifact/*.artifact-spec.ts` | full HTTP (supertest) + Nest + real MSSQL | Acceptance of the whole slice |
| **Controller contract** | `tests/modules/.../infrastructure/narrow/*controller.spec.ts` | Nest `TestingModule` + handler double | Validate HTTP request contract failures only |

### Rules

- **Artifact tests are the default and sole acceptance coverage for application behavior and persistence.** Use the real HTTP app and SQL Server through `ArtifactTestBase`; do not add domain unit, social-unit, adapter narrow, or repository contract tests for a feature unless explicitly requested.
- **Controller tests are the exception for HTTP request-contract failures only** (for example, a required path/query/body field is missing or has the wrong representation). Keep successful behavior, use-case outcomes, and persistence assertions in artifact tests.
- **Request contract validation belongs in `ValidateRequests` in the controller.** Reject malformed/missing/wrongly typed contract values with `BadRequestException` (400). Do not test domain rules such as string lengths or other business invariants as controller validation.
- **Failure mapping:** expected not-found outcomes from a use case map to HTTP 404. Do not convert unrelated exceptions or infrastructure failures into 400/404; allow them to reach Nest's unhandled 500 response.
- **Repository arrange:** for artifact tests, arrange persisted state with direct SQL through `ArtifactTestBase.executeQuery`; do not use the repository/use case under test to seed its own preconditions.
- **Infrastructure base:** extend `ArtifactTestBase` (`tests/base/artifact-test.base.ts`) for a booted Nest app and isolated SQL Server database; it exposes `executeQuery` and `cleanTable`.
- **Isolation:** clean tables touched by artifact tests so database state does not leak between cases.
- **Docker:** artifact tests require Docker; give container setup a `60000` ms timeout. They are excluded from `test:unit` by `--exclude='**/*.artifact-spec.ts'`.
- **Assertions:** use shared helpers from `tests/helpers/assert/` (e.g. `assertOutboxMessageInDatabase`) instead of re-implementing established assertions.
- **Naming**: `describe("When ...")` for scenarios, `it("should ...")` for outcomes. One behavior per test.
- **New feature checklist — coverage required:** artifact acceptance tests for positive HTTP behavior, persistence, and use-case outcomes; controller tests only for request-contract rejection. Keep docs (`README.md`) in sync when endpoint documentation changes.

## Development workflow: Artifact-First Outside-In TDD

Default workflow for a new feature slice: drive implementation from HTTP artifact acceptance. Controller tests are reserved for the boundary's malformed-request contract.

1. **Artifact red:** write a failing `*.artifact-spec.ts` describing the positive HTTP behavior. It must fail as an assertion for the right reason—not because Nest cannot boot or DI cannot resolve.
2. **Implement inward:** add the minimum domain/application/adapter/controller wiring needed to satisfy the behavior, preserving hexagonal dependency direction. Do not add lower-level test layers for the feature.
3. **Contract cases:** add controller tests only when validating missing, malformed, or incorrectly represented HTTP inputs; keep business/domain validation out of this layer.
4. **Close the loop:** stop when artifact acceptance is green. Run it at checkpoints and at the end; it requires Docker.

Guardrails:

- **Meaningful red:** override providers at the composition boundary (as `ArtifactTestBase` does). A Nest boot/DI error is not an acceptable "red".
- **Controller contract cases:** test negative HTTP request representation at the controller level only. Do not test use-case result mapping there; verify positive and not-found outcomes through artifacts.
- **Cost:** the outer loop is slow (Docker, `60000` ms). Iterate in the inner loop; run the outer loop when the slice is plausibly complete.
- **Refactor only on green.**
- **Relationship to the checklist:** the *New feature checklist* above defines required coverage; this workflow defines the order in which to author it.
