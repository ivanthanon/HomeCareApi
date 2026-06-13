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
  return currentDate.getFullYear() - new Date(dateOfBirth).getFullYear() >= 18;
}
