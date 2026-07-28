import { describe, beforeAll, afterAll, expect } from 'vitest';
import { EmployeeRepositoryContractTest } from 'tests/modules/employees/infrastructure/contract/employee/EmployeeRepositoryContractTest';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerEmployeeRepository';
import { TestcontainerSetup } from 'tests/base/testcontainer-setup';
import testContainerSettings from 'tests/base/testContainerSettings.json';
import { Employee } from 'src/modules/employees/domain/employee';

class SqlServerEmployeeRepositoryContract extends EmployeeRepositoryContractTest {
  private containerSetup = new TestcontainerSetup(testContainerSettings);

  async startDatabase(): Promise<void> {
    await this.containerSetup.startDatabaseTestContainer();
  }

  async stopDatabase(): Promise<void> {
    await this.containerSetup.stop();
  }

  protected createRepository(): SqlServerEmployeeRepository {
    return new SqlServerEmployeeRepository(this.containerSetup.dbConnection);
  }

  protected async cleanUp(): Promise<void> {
    await this.containerSetup.cleanTable('employees');
  }

  protected async customArrange(employee: Employee): Promise<void> {
      await this.containerSetup.executeQuery(
        `INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth) 
        VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)`,
        {
          id: employee.id.value,
          firstName: employee.firstName.value,
          lastName: employee.lastName.value,
          documentNumber: employee.documentNumber.value,
          dateOfBirth: new Date(employee.dateOfBirth.value)
        }
      );
  }

  protected async customAssert(expectedEmployee: Employee): Promise<void> {
    const result = await this.containerSetup.executeQuery(
      'SELECT * FROM employees WHERE id = @id',
      { id: expectedEmployee.id.value },
    );
    expect(result.recordset).toHaveLength(1);
    expect(result.recordset[0]).toEqual({
      id: expectedEmployee.id.value,
      firstName: expectedEmployee.firstName.value,
      lastName: expectedEmployee.lastName.value,
      documentNumber: expectedEmployee.documentNumber.value,
      dateOfBirth: expectedEmployee.dateOfBirth.value,
    });
  }
}

describe('SqlServerEmployeeRepository contract', () => {
  const contract = new SqlServerEmployeeRepositoryContract();

  beforeAll(async () => {
    await contract.startDatabase();
  }, 60000);

  afterAll(async () => {
    await contract.stopDatabase();
  });

  contract.runContractTest();
});
