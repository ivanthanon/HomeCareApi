import { Ok, Err, Result } from 'src/modules/employees/domain/shared/result';
import { EmployeeValidationError } from '../errors/employeeValidationError';

export class DateOfBirth {
  private readonly timestamp: number;

  public constructor(value: Date) {
    this.timestamp = value.getTime();
  }

  public get value(): Date {
    return new Date(this.timestamp);
  }

  public static create(
    value: Date,
    currentDate: Date,
    ageOfMajority: number,
  ): Result<DateOfBirth, EmployeeValidationError> {
    if (isNaN(value.getTime())) {
      return Err(
        new EmployeeValidationError(
          'employee.date_of_birth.invalid',
          'The date of birth is not a valid Date',
        ),
      );
    }

    if (!this.IsAdult(currentDate, value, ageOfMajority)) {
      return Err(
        new EmployeeValidationError(
          'employee.date_of_birth.underage',
          'Employee must be an adult',
        ),
      );
    }

    return Ok(new DateOfBirth(value));
  }

  private static IsAdult(
    currentDate: Date,
    dateOfBirth: Date,
    ageOfMajority: number,
  ): boolean {
    const yearDiff = currentDate.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = currentDate.getMonth() - dateOfBirth.getMonth();
    const dayDiff = currentDate.getDate() - dateOfBirth.getDate();

    if (
      yearDiff > ageOfMajority ||
      (yearDiff === ageOfMajority &&
        (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
    ) {
      return true;
    }

    return false;
  }
}
