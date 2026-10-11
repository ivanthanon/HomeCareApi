import { Employee } from "src/modules/employees/domain/employee";
import { EmployeeRepository } from "src/modules/employees/domain/repositories/employee.repository";

export class EmployeeInMemoryRepository implements EmployeeRepository {
    public employeeList : Employee[] = [];

    public constructor() { }

    async getBy(id: string): Promise<Employee | null> {
        const employee = this.employeeList.find(emp => emp.id.value === id && emp.deletedAt === null);
        return employee || null;    
    }

    async create(employee: Employee): Promise<void> {
        this.employeeList.push(employee);
    }

    async softDelete(employee: Employee): Promise<void> {
        const storedEmployee = this.employeeList.find(emp => emp.id.value === employee.id.value);

        if (storedEmployee) {
            storedEmployee.deletedAt = employee.deletedAt;
        }
    }
}