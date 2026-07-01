import { Err, Ok, Result } from "./shared/result";
import { DateOfBirth } from "./value-objects/DateOfBirth";
import { DocumentNumber } from "./value-objects/DocumentNumber";
import { EmployeeId } from "./value-objects/EmployeeId";
import { Name } from "./value-objects/Name";
import { DomainEvent } from "./shared/domainevent";
import { EmployeeCreatedV1 } from "./events/EmployeeCreatedV1";

export class Employee {
  public constructor(
    readonly id: EmployeeId,
    readonly firstName: Name,
    readonly lastName: Name,
    readonly documentNumber: DocumentNumber,
    readonly dateOfBirth: DateOfBirth,
  ) { }

  public DomainEvents: DomainEvent[] = [];

  public static create(
    id: string,
    firstName: string,
    lastName: string,
    documentNumber: string,
    dateOfBirth: string,
    currentDate: Date,
    ageOfMajority: number
  ): Result<Employee, Error> {

    const employeeIdValueObject = EmployeeId.create(id);
    if (employeeIdValueObject.success === false) {
      return Err(new Error(employeeIdValueObject.error.message));
    }

    const firstNameValueObject = Name.create(firstName);
    if (firstNameValueObject.success === false) {
      return Err(new Error(firstNameValueObject.error.message));
    }

    const lastNameValueObject = Name.create(lastName);
    if (lastNameValueObject.success === false) {
      return Err(new Error(lastNameValueObject.error.message));
    }

    const documentNumberValueObject = DocumentNumber.create(documentNumber);
    if (documentNumberValueObject.success === false) {
      return Err(new Error(documentNumberValueObject.error.message));
    }

    const dateOfBirthValueObject = DateOfBirth.create(dateOfBirth, currentDate, ageOfMajority);
    if (dateOfBirthValueObject.success === false) {
      return Err(new Error(dateOfBirthValueObject.error.message));
    }

    const employee = new Employee(
      employeeIdValueObject.value,
      firstNameValueObject.value,
      lastNameValueObject.value,
      documentNumberValueObject.value,
      dateOfBirthValueObject.value
    );

    employee.DomainEvents.push(
      new EmployeeCreatedV1(
        employee.id.value,
        employee.firstName.value,
        employee.lastName.value,
        employee.documentNumber.value,
        employee.dateOfBirth.value,
        currentDate
      )
    );

    return Ok(employee);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = this.DomainEvents;
    this.DomainEvents = [];
    return events;
  }

  public static reconstitute(id: string, firstName: string, lastName: string, documentNumber: string, dateOfBirth: string): Employee {
        return new Employee(
            new EmployeeId(id),
            new Name(firstName),
            new Name(lastName),
            new DocumentNumber(documentNumber),
            new DateOfBirth(new Date(dateOfBirth)));
    }
}