import { Employee } from "src/modules/employees/domain/employee";
import { EmployeeId } from "src/modules/employees/domain/value-objects/EmployeeId";
import { DocumentNumber } from "src/modules/employees/domain/value-objects/DocumentNumber";

export interface EmployeeRepository {
  create(employee: Employee): Promise<void>;
  getBy(id: EmployeeId): Promise<Employee | null>;
  getByDocumentNumber(documentNumber: DocumentNumber): Promise<Employee | null>;
}
