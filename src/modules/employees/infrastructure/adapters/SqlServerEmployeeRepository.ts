import { ConnectionPool, Date, NVarChar, UniqueIdentifier } from 'mssql';
import { EmployeeRepository } from "src/modules/employees/domain/repositories/employee.repository";
import { Employee } from "src/modules/employees/domain/employee";

export class SqlServerEmployeeRepository implements EmployeeRepository {
    constructor(private readonly pool: ConnectionPool) {}

    async create(employee: Employee): Promise<void> {
        await this.pool.request()
            .input('id', UniqueIdentifier, employee.id.value)
            .input('firstName', NVarChar, employee.firstName.value)
            .input('lastName', NVarChar, employee.lastName.value)
            .input('documentNumber', NVarChar, employee.documentNumber.value)
            .input('dateOfBirth', Date, employee.dateOfBirth.value)
            .query(`
                INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
                VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
            `);
    }
}