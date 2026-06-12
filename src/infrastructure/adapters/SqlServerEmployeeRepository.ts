import { Injectable } from '@nestjs/common';
import sql from 'mssql';
import { Employee, EmployeeRepository } from "src/app/ports/driven/employee.repository";

@Injectable()
export class SqlServerEmployeeRepository implements EmployeeRepository {
    constructor(private readonly pool: sql.ConnectionPool) {}

    async create(employee: Employee): Promise<void> {
        await this.pool.request()
            .input('id', sql.UniqueIdentifier, employee.id)
            .input('firstName', sql.NVarChar, employee.firstName)
            .input('lastName', sql.NVarChar, employee.lastName)
            .input('documentNumber', sql.NVarChar, employee.documentNumber)
            .input('dateOfBirth', sql.Date, employee.dateOfBirth)
            .query(`
                INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
                VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
            `);
    }
}