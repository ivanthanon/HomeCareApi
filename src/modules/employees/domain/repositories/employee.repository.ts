import { Employee } from "src/modules/employees/domain/employee";

export interface EmployeeRepository {
  create(employee: Employee): Promise<void>;
  getBy(id: string): Promise<Employee | null>;
}
