import { Err, Ok, Result } from 'src/modules/employees/domain/shared/result';
import { Employee } from 'src/modules/employees/domain/employee';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { EmployeeId } from 'src/modules/employees/domain/value-objects/EmployeeId';
import { EmployeeNotFoundError } from 'src/modules/employees/application/errors/employeeNotFoundError';

export class GetEmployeeByIdQuery {
  constructor(readonly id: string) {}
}

export class GetEmployeeByIdQueryHandler {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetEmployeeByIdQuery): Promise<Result<Employee, Error>> {
    const employee = await this.employeeRepository.getBy(
      new EmployeeId(query.id),
    );

    if (employee === null) {
      return Err(new EmployeeNotFoundError(query.id));
    }

    return Ok(employee);
  }
}
