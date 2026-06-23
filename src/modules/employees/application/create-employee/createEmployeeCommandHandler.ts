import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { Employee } from 'src/modules/employees/domain/employee';
import { Err, Ok, Result } from 'src/modules/employees/domain/shared/result';
import { Clock } from 'src/modules/employees/domain/shared/clock';

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
  constructor(private readonly employeeRepository: EmployeeRepository, private readonly clock: Clock) {}
  
  async execute(command: CreateEmployeeCommand): Promise<Result<void, Error>> {
    const employeeResult = Employee.create(command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth, this.clock.now());

    if (employeeResult.success === false) {
      return employeeResult;
    }

    await this.employeeRepository.create(employeeResult.value);
    
    return Ok();
  }
}