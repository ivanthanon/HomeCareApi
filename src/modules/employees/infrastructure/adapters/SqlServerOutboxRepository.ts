import { ConnectionPool, NVarChar, UniqueIdentifier } from 'mssql';
import { OutboxRepository } from 'src/modules/employees/domain/repositories/outbox.repository';
import { DomainEvent } from 'src/modules/employees/domain/shared/domainevent';

export class SqlServerOutboxRepository implements OutboxRepository {
    constructor(private readonly pool: ConnectionPool) {}

    async save(event: DomainEvent): Promise<void> {
        const employeeEvent = event as any;

        await this.pool.request()
            .input('type', NVarChar, event.eventName)
            .input('aggregateId', UniqueIdentifier, employeeEvent.id)
            .input('aggregateType', NVarChar, 'Employee')
            .input('payload', NVarChar('max'), JSON.stringify(event))
            .query(`
                INSERT INTO outboxMessages (type, aggregateId, aggregateType, payload)
                VALUES (@type, @aggregateId, @aggregateType, @payload)
            `);
    }
}
