import { Injectable } from '@nestjs/common';
import { Employee, EmployeeRepository } from "src/app/ports/driven/employee.repository";

@Injectable()
export class SqlServerEmployeeRepository implements EmployeeRepository {
    create(employee: Employee): Promise<void> {
        throw new Error("Method not implemented.");
    }
}