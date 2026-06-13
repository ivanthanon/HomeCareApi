import { Inject, Injectable, Scope } from '@nestjs/common';
import { EmployeeRepository } from 'src/modules/employees/application/ports/driven/employee.repository';
import { Employee } from 'src/modules/employees/domain/entities/employee';

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
  constructor(private readonly employeeRepository: EmployeeRepository) {}
  
  async execute(command: CreateEmployeeCommand): Promise<void> {
    const employee = new Employee(command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth);
    
    await this.employeeRepository.create(employee);
  }
}