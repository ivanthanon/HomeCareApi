export interface DomainEvent {
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly aggregateType: string;
}
