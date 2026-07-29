import { describe, beforeAll, afterAll, expect } from 'vitest';
import { OutboxRepositoryContractTest } from 'tests/modules/employees/infrastructure/contract/outbox/OutboxRepositoryContractTest';
import { SqlServerOutboxRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository';
import { SqlServerTransactionScope } from 'src/modules/employees/infrastructure/adapters/sqlServerTransactionScope';
import { TestcontainerSetup } from 'tests/base/testcontainer-setup';
import testContainerSettings from 'tests/base/testContainerSettings.json';
import { EmployeeCreatedV1 } from 'src/modules/employees/domain/events/EmployeeCreatedV1';
import { assertOutboxMessageInDatabase } from 'tests/helpers/assert/OutboxTestHelper';

class SqlServerOutboxRepositoryContract extends OutboxRepositoryContractTest {
  private containerSetup = new TestcontainerSetup(testContainerSettings);

  async startDatabase(): Promise<void> {
    await this.containerSetup.startDatabaseTestContainer();
  }

  async stopDatabase(): Promise<void> {
    await this.containerSetup.stop();
  }

  protected createRepository(): SqlServerOutboxRepository {
    const transactionScope = new SqlServerTransactionScope(this.containerSetup.dbConnection);
    return new SqlServerOutboxRepository(transactionScope);
  }

  protected async cleanUp(): Promise<void> {
    await this.containerSetup.cleanTable('outboxMessages');
  }

  protected async customAssert(expectedEvent: EmployeeCreatedV1): Promise<void> {
    const result = await this.containerSetup.executeQuery(
      'SELECT * FROM outboxMessages WHERE aggregateId = @id',
      { id: expectedEvent.id },
    );

    assertOutboxMessageInDatabase(result.recordset, {
      aggregateId: expectedEvent.id,
      aggregateType: 'Employee',
      event: expectedEvent,
    });
  }
}

describe('SqlServerOutboxRepository contract', () => {
  const contract = new SqlServerOutboxRepositoryContract();

  beforeAll(async () => {
    await contract.startDatabase();
  }, 60000);

  afterAll(async () => {
    await contract.stopDatabase();
  });

  contract.runContractTest();
});
