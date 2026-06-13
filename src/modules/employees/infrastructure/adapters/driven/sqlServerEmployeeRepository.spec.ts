import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { TestcontainerSetup } from 'testhelpers/base/testcontainer-setup';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/driven/SqlServerEmployeeRepository';
import { Employee } from 'src/modules/employees/domain/entities/employee';

import testContainerSettings from 'testhelpers/base/testContainerSettings.json';

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
      const employee = new Employee(
        '550E8400-E29B-41D4-A716-446655440000',
        'María',
        'García López',
        '12345678A',
        '1985-03-15',
      );

      await repository.create(employee);

      const result = await setup.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: employee.id },
      );
      expect(result.recordset).toHaveLength(1);
      const fromDb = result.recordset[0];
      const employeeFromDb = new Employee(
        fromDb.id,
        fromDb.firstName,
        fromDb.lastName,
        fromDb.documentNumber,
        new Date(fromDb.dateOfBirth).toISOString().split('T')[0],
      );
      expect(employeeFromDb).toEqual(employee);
    });
  });
});
