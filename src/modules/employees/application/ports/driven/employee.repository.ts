import { Employee } from "src/modules/employees/domain/entities/employee";

export interface EmployeeRepository {
  create(employee: Employee): Promise<void>;
}
