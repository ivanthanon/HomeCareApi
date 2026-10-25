import { Ok, Err, Result } from 'src/modules/employees/domain/shared/result';
import { isAValidGuid } from '../shared/utils';
import { EmployeeValidationError } from '../errors/employeeValidationError';

export class EmployeeId {
  public constructor(readonly value: string) {}

  public static create(
    value: string,
  ): Result<EmployeeId, EmployeeValidationError> {
    if (isAValidGuid(value) == false) {
      return Err(
        new EmployeeValidationError(
          'employee.id.invalid',
          'Invalid UUID format',
        ),
      );
    }

    return Ok(new EmployeeId(value));
  }
}
