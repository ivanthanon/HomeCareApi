import { Employee } from 'src/modules/employees/domain/employee';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { EmployeeId } from 'src/modules/employees/domain/value-objects/EmployeeId';
import { DocumentNumber } from 'src/modules/employees/domain/value-objects/DocumentNumber';

export class EmployeeInMemoryRepository implements EmployeeRepository {
  public employeeList: Employee[] = [];

  public constructor() {}

  async getBy(id: EmployeeId): Promise<Employee | null> {
    const employee = this.employeeList.find((emp) => emp.id.value === id.value);
    return employee || null;
  }

  async getByDocumentNumber(
    documentNumber: DocumentNumber,
  ): Promise<Employee | null> {
    const employee = this.employeeList.find(
      (emp) => emp.documentNumber.value === documentNumber.value,
    );
    return employee || null;
  }

  async create(employee: Employee): Promise<void> {
    this.employeeList.push(employee);
  }
}
