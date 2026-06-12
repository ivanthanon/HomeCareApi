import { Inject, Injectable } from '@nestjs/common';
import { Employee, EmployeeRepository } from '../../ports/driven/employee.repository';

export class CreateEmployeeCommand {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly documentNumber: string,
    readonly dateOfBirth: string,
  ) {}
}

@Injectable()
export class CreateEmployeeCommandHandler {
  constructor(@Inject('EMPLOYEE_REPOSITORY') private readonly employeeRepository: EmployeeRepository) {}
  
  async execute(command: CreateEmployeeCommand): Promise<void> {
    const employee = new Employee(command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth);
    
    await this.employeeRepository.create(employee);
  }
}