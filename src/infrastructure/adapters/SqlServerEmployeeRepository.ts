import { Injectable, Scope } from '@nestjs/common';
import { ConnectionPool, Date, NVarChar, UniqueIdentifier } from 'mssql';
import { Employee, EmployeeRepository } from "src/app/ports/driven/employee.repository";

@Injectable({ scope: Scope.REQUEST })
export class SqlServerEmployeeRepository implements EmployeeRepository {
    constructor(private readonly pool: ConnectionPool) {}

    async create(employee: Employee): Promise<void> {
        await this.pool.request()
            .input('id', UniqueIdentifier, employee.id)
            .input('firstName', NVarChar, employee.firstName)
            .input('lastName', NVarChar, employee.lastName)
            .input('documentNumber', NVarChar, employee.documentNumber)
            .input('dateOfBirth', Date, employee.dateOfBirth)
            .query(`
                INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
                VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
            `);
    }
}