import { DomainEvent } from "../shared/domainevent";

export class EmployeeDeletedV1 implements DomainEvent {
  public readonly eventName = "EmployeeDeleted.v1";

  constructor(
    public readonly id: string,
    public readonly occurredOn: Date
  ) {}
}
