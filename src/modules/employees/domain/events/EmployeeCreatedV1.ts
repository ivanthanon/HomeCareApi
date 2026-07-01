import { DomainEvent } from "../shared/domainevent";

export class EmployeeCreatedV1 implements DomainEvent {
  public readonly eventName = "EmployeeCreated.v1";

  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly documentNumber: string,
    public readonly dateOfBirth: Date,
    public readonly occurredOn: Date
  ) {}
}
