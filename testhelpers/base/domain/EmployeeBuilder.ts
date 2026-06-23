import { Employee } from "src/modules/employees/domain/employee";
import { DateOfBirth } from "src/modules/employees/domain/value-objects/DateOfBirth";
import { DocumentNumber } from "src/modules/employees/domain/value-objects/DocumentNumber";
import { EmployeeId } from "src/modules/employees/domain/value-objects/EmployeeId";
import { Name } from "src/modules/employees/domain/value-objects/Name";


export class EmployeeBuilder {
    static fromPrimitives(id: string, firstName: string, lastName: string, documentNumber: string, dateOfBirth: string): Employee {
        return new Employee(
            new EmployeeId(id),
            new Name(firstName),
            new Name(lastName),
            new DocumentNumber(documentNumber),
            new DateOfBirth(new Date(dateOfBirth)));
    }
}