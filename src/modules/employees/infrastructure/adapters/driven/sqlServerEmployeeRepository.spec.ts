import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { TestcontainerSetup } from 'testhelpers/base/testcontainer-setup';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/driven/SqlServerEmployeeRepository';
import testContainerSettings from 'testhelpers/base/testContainerSettings.json';
import { EmployeeBuilder } from 'testhelpers/base/domain/EmployeeBuilder';

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
      const employeeToCreate = EmployeeBuilder.fromPrimitives(
        '550E8400-E29B-41D4-A716-446655440000',
        'María',
        'García López',
        '12345678A',
        '1985-03-15',
      );
    
      await repository.create(employeeToCreate);

      const result = await setup.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: employeeToCreate.id.value },
      );
      expect(result.recordset).toHaveLength(1);
      const fromDb = result.recordset[0];
      expect(fromDb).toMatchObject({
        id: employeeToCreate.id.value,
        firstName: employeeToCreate.firstName.value,
        lastName: employeeToCreate.lastName.value,
        documentNumber: employeeToCreate.documentNumber.value,
      });
      const expectedDate = new Date(employeeToCreate.dateOfBirth.value).toISOString().split('T')[0];
      const actualDate = fromDb.dateOfBirth.toISOString().split('T')[0];
      expect(actualDate).toBe(expectedDate);
    });
  });
});
