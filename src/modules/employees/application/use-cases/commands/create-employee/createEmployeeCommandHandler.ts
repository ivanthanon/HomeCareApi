import { EmployeeRepository } from 'src/modules/employees/application/ports/driven/employee.repository';
import { Employee } from 'src/modules/employees/domain/entities/employee';
import { Err, Ok, Result } from 'src/modules/employees/domain/shared/result';

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
  
  async execute(command: CreateEmployeeCommand): Promise<Result<void, Error>> {
    const employeeResult = Employee.create(command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth);

    if (employeeResult.success === false) {
      return employeeResult;
    }

    await this.employeeRepository.create(employeeResult.value);
    
    return Ok(undefined);
  }
}