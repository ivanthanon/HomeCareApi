import { DomainEvent } from "../shared/domainevent";

export interface OutboxRepository {
  save(event: DomainEvent): Promise<void>;
}
