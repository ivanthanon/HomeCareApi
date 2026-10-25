import { DomainEvent } from '../shared/domainevent';

export class EmployeeCreatedV1 implements DomainEvent {
  public readonly eventName = 'EmployeeCreated.v1';
  private readonly dateOfBirthTimestamp: number;
  private readonly occurredOnTimestamp: number;

  get aggregateId(): string {
    return this.id;
  }

  get aggregateType(): string {
    return 'Employee';
  }

  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly documentNumber: string,
    dateOfBirth: Date,
    occurredOn: Date,
  ) {
    this.dateOfBirthTimestamp = dateOfBirth.getTime();
    this.occurredOnTimestamp = occurredOn.getTime();
  }

  get dateOfBirth(): Date {
    return new Date(this.dateOfBirthTimestamp);
  }

  get occurredOn(): Date {
    return new Date(this.occurredOnTimestamp);
  }
}
