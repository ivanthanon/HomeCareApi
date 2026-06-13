import { Err, Ok, Result } from "../shared/result";

export class Employee {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly documentNumber: string,
    readonly dateOfBirth: string
  ) {}

  public static create(
    id: string,
    firstName: string,
    lastName: string,
    documentNumber: string,
    dateOfBirth: string
  ): Result<Employee, Error> {
    
    if (new Date().getFullYear() - new Date(dateOfBirth).getFullYear() < 18) {
      return Err(new Error('Employee must be an adult'));
    }
    
    return Ok(new Employee(id, firstName, lastName, documentNumber, dateOfBirth));
  }
}