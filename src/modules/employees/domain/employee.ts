import { Err, Ok, Result } from './shared/result';
import { DateOfBirth } from './value-objects/DateOfBirth';
import { DocumentNumber } from './value-objects/DocumentNumber';
import { EmployeeId } from './value-objects/EmployeeId';
import { Name } from './value-objects/Name';
import { DomainEvent } from './shared/domainevent';
import { EmployeeCreatedV1 } from './events/EmployeeCreatedV1';
import { EmployeeValidationError } from './errors/employeeValidationError';

export interface CreateEmployeeProps {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: Date;
  currentDate: Date;
  ageOfMajority: number;
}

export class Employee {
  private domainEvents: DomainEvent[] = [];

  private constructor(
    readonly id: EmployeeId,
    readonly firstName: Name,
    readonly lastName: Name,
    readonly documentNumber: DocumentNumber,
    readonly dateOfBirth: DateOfBirth,
  ) {}

  public static create({
    id,
    firstName,
    lastName,
    documentNumber,
    dateOfBirth,
    currentDate,
    ageOfMajority,
  }: CreateEmployeeProps): Result<Employee, EmployeeValidationError> {
    const employeeIdValueObject = EmployeeId.create(id);
    if (employeeIdValueObject.success === false) {
      return Err(employeeIdValueObject.error);
    }

    const firstNameValueObject = Name.create(firstName);
    if (firstNameValueObject.success === false) {
      return Err(firstNameValueObject.error);
    }

    const lastNameValueObject = Name.create(lastName);
    if (lastNameValueObject.success === false) {
      return Err(lastNameValueObject.error);
    }

    const documentNumberValueObject = DocumentNumber.create(documentNumber);
    if (documentNumberValueObject.success === false) {
      return Err(documentNumberValueObject.error);
    }

    const dateOfBirthValueObject = DateOfBirth.create(
      dateOfBirth,
      currentDate,
      ageOfMajority,
    );
    if (dateOfBirthValueObject.success === false) {
      return Err(dateOfBirthValueObject.error);
    }

    const employee = new Employee(
      employeeIdValueObject.value,
      firstNameValueObject.value,
      lastNameValueObject.value,
      documentNumberValueObject.value,
      dateOfBirthValueObject.value,
    );

    employee.domainEvents.push(
      new EmployeeCreatedV1(
        employee.id.value,
        employee.firstName.value,
        employee.lastName.value,
        employee.documentNumber.value,
        employee.dateOfBirth.value,
        currentDate,
      ),
    );

    return Ok(employee);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }

  public static reconstitute(
    id: string,
    firstName: string,
    lastName: string,
    documentNumber: string,
    dateOfBirth: Date,
  ): Employee {
    return new Employee(
      new EmployeeId(id),
      new Name(firstName),
      new Name(lastName),
      new DocumentNumber(documentNumber),
      new DateOfBirth(dateOfBirth),
    );
  }
}
