import { DomainEvent } from "src/modules/employees/domain/shared/domainevent";
import { OutboxRepository } from "src/modules/employees/domain/repositories/outbox.repository";

export class OutboxFakeRepository implements OutboxRepository {
    public events: DomainEvent[] = [];

    async save(event: DomainEvent): Promise<void> {
        this.events.push(event);
    }
}
