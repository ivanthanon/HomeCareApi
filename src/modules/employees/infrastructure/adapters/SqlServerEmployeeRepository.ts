import { ConnectionPool, Date, NVarChar, UniqueIdentifier } from 'mssql';
import { EmployeeRepository } from "src/modules/employees/domain/repositories/employee.repository";
import { Employee } from "src/modules/employees/domain/employee";
import { EmployeeFactory } from 'tests/modules/employees/domain/EmployeeFactory';

export class SqlServerEmployeeRepository implements EmployeeRepository {
    constructor(private readonly pool: ConnectionPool) {}


    async getBy(id: string): Promise<Employee | null> {
        const result = await this.pool.request()
        .input('id', UniqueIdentifier, id)
        .query(`SELECT id, firstName, lastName, documentNumber, dateOfBirth 
            FROM Employees 
            WHERE id = @id`);

        if (!result.recordset || result.recordset.length === 0) {
            return null;
        }

        const rawEmployee = result.recordset[0];

        return EmployeeFactory.fromPrimitives(rawEmployee.id, rawEmployee.firstName, rawEmployee.lastName, rawEmployee.documentNumber, rawEmployee.dateOfBirth);
    }

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