import { Date, NVarChar, UniqueIdentifier } from 'mssql';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { Employee } from 'src/modules/employees/domain/employee';
import { SqlServerTransactionScope } from './sqlServerTransactionScope';
import { EmployeeId } from 'src/modules/employees/domain/value-objects/EmployeeId';
import { DocumentNumber } from 'src/modules/employees/domain/value-objects/DocumentNumber';

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: globalThis.Date;
}

export class SqlServerEmployeeRepository implements EmployeeRepository {
  constructor(private readonly transactionScope: SqlServerTransactionScope) {}

  async getBy(id: EmployeeId): Promise<Employee | null> {
    const result = await this.transactionScope
      .getRequest()
      .input('id', UniqueIdentifier, id.value)
      .query<EmployeeRow>(`SELECT id, firstName, lastName, documentNumber, dateOfBirth 
                FROM employees 
                WHERE id = @id`);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const rawEmployee = result.recordset[0];

    return Employee.reconstitute(
      rawEmployee.id,
      rawEmployee.firstName,
      rawEmployee.lastName,
      rawEmployee.documentNumber,
      rawEmployee.dateOfBirth,
    );
  }

  async getByDocumentNumber(
    documentNumber: DocumentNumber,
  ): Promise<Employee | null> {
    const result = await this.transactionScope
      .getRequest()
      .input('documentNumber', NVarChar, documentNumber.value)
      .query<EmployeeRow>(`SELECT id, firstName, lastName, documentNumber, dateOfBirth
                FROM employees
                WHERE documentNumber = @documentNumber`);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const rawEmployee = result.recordset[0];

    return Employee.reconstitute(
      rawEmployee.id,
      rawEmployee.firstName,
      rawEmployee.lastName,
      rawEmployee.documentNumber,
      rawEmployee.dateOfBirth,
    );
  }

  async create(employee: Employee): Promise<void> {
    await this.transactionScope
      .getRequest()
      .input('id', UniqueIdentifier, employee.id.value)
      .input('firstName', NVarChar, employee.firstName.value)
      .input('lastName', NVarChar, employee.lastName.value)
      .input('documentNumber', NVarChar, employee.documentNumber.value)
      .input('dateOfBirth', Date, employee.dateOfBirth.value).query(`
                INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
                VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
            `);
  }
}
