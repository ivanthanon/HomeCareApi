import { Err, Ok, Result } from "../shared/result";

export class Employee {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly documentNumber: string,
    readonly dateOfBirth: string
  ) { }

  public static create(
    id: string,
    firstName: string,
    lastName: string,
    documentNumber: string,
    dateOfBirth: string,
    currentDate: Date,
  ): Result<Employee, Error> {

    if (IsAdult(currentDate, dateOfBirth)) {
      return Ok(new Employee(id, firstName, lastName, documentNumber, dateOfBirth));
    }

    return Err(new Error('Employee must be an adult'));
  }
}

function IsAdult(currentDate: Date, dateOfBirth: string) {
  const yearDiff = currentDate.getFullYear() - new Date(dateOfBirth).getFullYear();
  const monthDiff = currentDate.getMonth() - new Date(dateOfBirth).getMonth();
  const dayDiff = currentDate.getDate() - new Date(dateOfBirth).getDate();

  if (yearDiff > 18 || (yearDiff === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))) {
    return true;
  }

  return false;
}
