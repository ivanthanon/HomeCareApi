import { Employee } from "src/modules/employees/domain/employee";
import { EmployeeRepository } from "src/modules/employees/domain/repositories/employee.repository";

export class EmployeeInMemoryRepository implements EmployeeRepository {
    public employeeList : Employee[] = [];

    public constructor() { }

    async create(employee: Employee): Promise<void> {
        this.employeeList.push(employee);
    }
}