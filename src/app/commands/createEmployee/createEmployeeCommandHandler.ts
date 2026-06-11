import { EmployeeRepository } from '../../ports/driven/employee.repository';

export class CreateEmployeeCommand {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly documentNumber: string,
    readonly dateOfBirth: string,
  ) {}
}

export class CreateEmployeeCommandHandler {
  constructor(private readonly workerRepository: EmployeeRepository) {}
  
  async execute(command: CreateEmployeeCommand): Promise<void> {
    await this.workerRepository.create(command);
  }q
}