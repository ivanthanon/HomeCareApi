import { Employee, EmployeeRepository } from "src/app/ports/driven/employee.repository";

export class SqlServerEmployeeRepository implements EmployeeRepository {
    create(employee: Employee): Promise<void> {
        throw new Error("Method not implemented.");
    }
}