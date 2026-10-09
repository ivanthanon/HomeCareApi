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
- Prefer `Result` and explicit types at layer boundaries.
- Imports may use the `src/`, `tests/`, `@/` aliases (see `vitest.config.ts`) or relative paths; follow the surrounding file.
- Do not add comments unless they carry non-obvious intent.

## Testing rules

Runner: **Vitest v4** (`vitest.config.ts`, globals enabled, node environment). Test files are `*.spec.ts` (unit/narrow/contract) or `*.artifact-spec.ts` (E2E). Tests mirror the source path under `tests/`.

### Test pyramid — pick the right level

| Level | Location | Dependencies | Purpose |
|-------|----------|--------------|---------|
| **Unit** | `tests/modules/.../domain/**` | none | Validate Value Objects and the aggregate in isolation |
| **Social unit** | `tests/modules/.../application/**` | in-memory fakes + stubs + `vi.fn()` | Exercise the command handler with real collaborators |
| **Narrow integration** | `tests/modules/.../infrastructure/narrow/**` | real (Testcontainers MSSQL / Nest `TestingModule`) | One adapter/controller against real deps |
| **Contract** | `tests/modules/.../infrastructure/contract/**` | InMemory **and** SqlServer | Prove fake and real implementations share the same behavior |
| **Artifact (E2E)** | `tests/modules/.../infrastructure/artifact/*.artifact-spec.ts` | full HTTP (supertest) + Nest + real MSSQL | Acceptance of the whole slice |

### Rules

- **Contract tests are mandatory for ports/repositories.** Write an abstract `*ContractTest` (with `createRepository`, `customArrange`, `customAssert`, `cleanUp` hooks and a `runContractTest()`) and run it from **both** an `InMemory*Contract.spec.ts` and a `SqlServer*Contract.spec.ts`. Adding behavior to one implementation without the other breaks the contract suite.
- **Use the right double**: working in-memory implementation → `tests/doubles/fake/`; fixed-value replacement → `tests/doubles/stub/` (e.g. `DateClockStub`); interaction verification → inline `vi.fn()`. Never hit a real DB in unit/social tests.
- **Determinism**: inject `DateClockStub` and fixed dates. No wall-clock or unseeded randomness in assertions.
- **Infrastructure bases**: extend `TestcontainerSetup` (`tests/base/testcontainer-setup.ts`) for raw container access, or `ArtifactTestBase` (`tests/base/artifact-test.base.ts`) for a booted Nest app. Both create an isolated DB, run migrations, and expose `executeQuery` / `cleanTable`.
- **Isolation**: clean the tables you touch (`afterEach`/`beforeEach` via `cleanTable`) so narrow/contract/artifact tests do not leak state.
- **Docker**: narrow/contract/artifact tests require Docker; give container setup a `60000` ms timeout. Keep them out of `test:unit` (already excluded by `--exclude='**/*.artifact-spec.ts'`).
- **Assertions**: use shared helpers from `tests/helpers/assert/` (e.g. `assertOutboxEventInMemory`, `assertOutboxMessageInDatabase`) instead of re-implementing outbox checks.
- **Naming**: `describe("When ...")` for scenarios, `it("should ...")` for outcomes. One behavior per test.
- **New feature checklist — coverage required, not authoring order** (see *Development workflow* below for the order): domain VO/aggregate unit tests → handler social-unit test with fakes → contract coverage for any new port → narrow test for a new adapter → artifact test for the end-to-end HTTP slice. Keep docs (`README.md`) in sync.

## Development workflow: Double Loop Outside-In TDD

Default workflow for a new feature slice (Freeman & Pryce, *GOOS*): an **outer acceptance loop** and a fast **inner unit loop**.

1. **Outer loop (red):** write ONE failing `*.artifact-spec.ts` describing the acceptance behavior of the slice. It must fail as an **assertion** failure for the right reason — not because Nest cannot boot or DI cannot resolve. Keep the outer test red as the goal.
2. **Inner loop (fast):** drive inward from the failing behavior. Add one failing unit/social test using fakes and stubs, make it pass, refactor on green, repeat. The next thing to test is **the collaboration that is failing**, not a fixed layer.
3. **Close the loop:** stop when the outer artifact test goes green. Run the artifact test at checkpoints and at the end — not on every micro-step (it needs Docker).

Guardrails:

- **Meaningful red:** override providers at the composition boundary (as `ArtifactTestBase` does). A Nest boot/DI error is not an acceptable "red".
- **Cost:** the outer loop is slow (Docker, `60000` ms). Iterate in the inner loop; run the outer loop when the slice is plausibly complete.
- **Contracts still mandatory:** outside-in does not replace the InMemory + SqlServer contract test required for every port.
- **Refactor only on green.**
- **Exception — domain-only changes:** for a new Value Object or invariant with no new I/O, inside-out (domain unit tests first) is faster and the outer loop adds nothing.
- **Relationship to the checklist:** the *New feature checklist* above lists the coverage that must exist by the end; this workflow defines the order in which you author it.
