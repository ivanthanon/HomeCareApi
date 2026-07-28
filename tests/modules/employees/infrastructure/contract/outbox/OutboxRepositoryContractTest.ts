import { it, afterEach } from 'vitest';
import { OutboxRepository } from 'src/modules/employees/domain/repositories/outbox.repository';
import { EmployeeCreatedV1 } from 'src/modules/employees/domain/events/EmployeeCreatedV1';

export abstract class OutboxRepositoryContractTest {
    protected repository!: OutboxRepository;

    protected abstract createRepository(): OutboxRepository;

    protected async customArrange(event: EmployeeCreatedV1): Promise<void> { }

    protected async customAssert(expectedEvent: EmployeeCreatedV1): Promise<void> { }

    protected abstract cleanUp(): Promise<void>;

    public runContractTest() {

        beforeAll(async () => {
            this.repository = this.createRepository();
        });

        afterEach(async () => {
            await this.cleanUp();
        });

        it('should save a domain event', async () => {
            const expectedEvent = new EmployeeCreatedV1(
                '550E8400-E29B-41D4-A716-446655440000',
                'María',
                'García López',
                '12345678A',
                new Date('1985-03-15T00:00:00Z'),
                new Date('2026-01-01T00:00:00.000Z'),
            );

            await this.repository.save(expectedEvent);

            await this.customAssert(expectedEvent);
        });
    }
}