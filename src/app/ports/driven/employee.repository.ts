export class Employee {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly documentNumber: string,
    readonly dateOfBirth: string
  ) {}
}

export interface EmployeeRepository {
  create(command: Employee): Promise<void>;
}
