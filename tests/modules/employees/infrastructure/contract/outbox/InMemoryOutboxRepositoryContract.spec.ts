import { OutboxRepository } from 'src/modules/employees/application/ports/outbox.repository';
import { OutboxRepositoryContractTest } from 'tests/modules/employees/infrastructure/contract/outbox/OutboxRepositoryContractTest';
import { OutboxInMemoryRepository } from '../../../../../doubles/fake/OutboxInMemoryRepository';
import { EmployeeCreatedV1 } from 'src/modules/employees/domain/events/EmployeeCreatedV1';
import { assertOutboxEventInMemory } from 'tests/helpers/assert/OutboxTestHelper';

class InMemoryOutboxRepositoryContract extends OutboxRepositoryContractTest {

    public outboxInMemoryRepository!: OutboxInMemoryRepository;

    protected createRepository(): OutboxRepository {
        this.outboxInMemoryRepository = new OutboxInMemoryRepository();
        return this.outboxInMemoryRepository;
    }

    protected async cleanUp(): Promise<void> {
        this.outboxInMemoryRepository.events = [];
    }

    protected async customAssert(expectedEvent: EmployeeCreatedV1): Promise<void> {
        assertOutboxEventInMemory(this.outboxInMemoryRepository.events, expectedEvent);
    }
}

new InMemoryOutboxRepositoryContract().runContractTest();
