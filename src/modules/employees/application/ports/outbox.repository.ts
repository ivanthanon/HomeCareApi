import { DomainEvent } from "../../domain/shared/domainevent";

export interface OutboxRepository {
  save(event: DomainEvent): Promise<void>;
}
