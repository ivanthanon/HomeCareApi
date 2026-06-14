import { Employee } from "src/modules/employees/domain/employee";

export interface EmployeeRepository {
  create(employee: Employee): Promise<void>;
}
