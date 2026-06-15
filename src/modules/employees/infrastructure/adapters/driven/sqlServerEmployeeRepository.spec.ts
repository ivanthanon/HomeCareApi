import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { TestcontainerSetup } from 'testhelpers/base/testcontainer-setup';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/driven/SqlServerEmployeeRepository';
import { Employee } from 'src/modules/employees/domain/employee';

import testContainerSettings from 'testhelpers/base/testContainerSettings.json';
import { Success } from 'src/modules/employees/domain/shared/result';

class SqlServerEmployeeRepositoryTest extends TestcontainerSetup {
  constructor() {
    super(testContainerSettings);
  }
}

describe('SqlServerEmployeeRepository', () => {
  const setup = new SqlServerEmployeeRepositoryTest();
  let repository: SqlServerEmployeeRepository;

  beforeAll(async () => {
    await setup.startDatabaseTestContainer();
    repository = new SqlServerEmployeeRepository(setup.dbConnection);
  }, 60000);

  afterAll(async () => {
    await setup.stop();
  });

  describe('create', () => {
    it('Should insert an employee into the database', async () => {
      const expectedEmployee = {
        id: '550E8400-E29B-41D4-A716-446655440000',
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: '1985-03-15',
      };

      const employee = Employee.create(
        expectedEmployee.id,
        expectedEmployee.firstName,
        expectedEmployee.lastName,
        expectedEmployee.documentNumber,
        expectedEmployee.dateOfBirth,
        new Date()
      );
      const employeeResult : Success<Employee> = employee as Success<Employee>;
    
      await repository.create(employeeResult.value);

      const result = await setup.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: expectedEmployee.id },
      );
      expect(result.recordset).toHaveLength(1);
      const fromDb = result.recordset[0];
      expect(fromDb).toMatchObject({
        id: expectedEmployee.id,
        firstName: expectedEmployee.firstName,
        lastName: expectedEmployee.lastName,
        documentNumber: expectedEmployee.documentNumber,
      });
      const expectedDate = new Date(expectedEmployee.dateOfBirth).toISOString().split('T')[0];
      const actualDate = fromDb.dateOfBirth.toISOString().split('T')[0];
      expect(actualDate).toBe(expectedDate);
    });
  });
});
