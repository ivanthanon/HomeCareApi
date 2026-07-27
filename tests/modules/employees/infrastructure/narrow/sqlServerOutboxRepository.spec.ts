import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { TestcontainerSetup } from 'tests/base/testcontainer-setup';
import { SqlServerOutboxRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository';
import { EmployeeCreatedV1 } from 'src/modules/employees/domain/events/EmployeeCreatedV1';
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
      expect(result.recordset).toHaveLength(1);
      const fromDb = result.recordset[0];
      expect(fromDb.type).toBe('EmployeeCreated.v1');
      expect(fromDb.aggregateId).toBe(event.id);
      expect(fromDb.aggregateType).toBe('Employee');

      const payload = JSON.parse(fromDb.payload);
      expect(payload.eventName).toBe('EmployeeCreated.v1');
      expect(payload.id).toBe(event.id);
      expect(payload.firstName).toBe(event.firstName);
      expect(payload.lastName).toBe(event.lastName);
      expect(payload.documentNumber).toBe(event.documentNumber);
      expect(payload.dateOfBirth).toBe('1985-03-15T00:00:00.000Z');
      expect(payload.occurredOn).toBe('2026-01-01T00:00:00.000Z');

      expect(fromDb.processed).toBe(false);
      expect(fromDb.processedAt).toBeNull();
    });
  });
});
