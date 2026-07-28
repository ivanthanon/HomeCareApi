import { describe, it, beforeAll, afterAll } from 'vitest';
import { TestcontainerSetup } from 'tests/base/testcontainer-setup';
import { SqlServerOutboxRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository';
import { EmployeeCreatedV1 } from 'src/modules/employees/domain/events/EmployeeCreatedV1';
import { assertOutboxMessageInDatabase } from 'tests/helpers/assert/OutboxTestHelper';
import testContainerSettings from 'tests/base/testContainerSettings.json';

class SqlServerOutboxRepositoryTest extends TestcontainerSetup {
  constructor() {
    super(testContainerSettings);
  }
}

describe('SqlServerOutboxRepository', () => {
  const setup = new SqlServerOutboxRepositoryTest();
  let repository: SqlServerOutboxRepository;

  beforeAll(async () => {
    await setup.startDatabaseTestContainer();
    repository = new SqlServerOutboxRepository(setup.dbConnection);
  }, 60000);

  afterAll(async () => {
    await setup.stop();
  });

  beforeEach(async () => {
    await setup.cleanTable('outboxMessages');
  });

  describe('save', () => {
    it('should insert a domain event into the outboxMessages table', async () => {
      const event = new EmployeeCreatedV1(
        '550E8400-E29B-41D4-A716-446655440000',
        'María',
        'García López',
        '12345678A',
        new Date('1985-03-15T00:00:00Z'),
        new Date('2026-01-01T00:00:00.000Z'),
      );

      await repository.save(event);

      const result = await setup.executeQuery(
        'SELECT * FROM outboxMessages WHERE aggregateId = @id',
        { id: event.id },
      );

      assertOutboxMessageInDatabase(result.recordset, {
        aggregateId: event.id,
        aggregateType: 'Employee',
        event,
      });
    });
  });
});
