import { NVarChar, UniqueIdentifier } from 'mssql';
import { OutboxRepository } from 'src/modules/employees/application/ports/outbox.repository';
import { DomainEvent } from 'src/modules/employees/domain/shared/domainevent';
import { SqlServerTransactionScope } from './sqlServerTransactionScope';

export class SqlServerOutboxRepository implements OutboxRepository {
    constructor(private readonly transactionScope: SqlServerTransactionScope) {}

    async save(event: DomainEvent): Promise<void> {
        const employeeEvent = event as any;

        await this.transactionScope.getRequest()
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
