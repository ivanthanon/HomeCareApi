import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { TestcontainerSetup } from 'tests/base/testcontainer-setup';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerEmployeeRepository';
import testContainerSettings from 'tests/base/testContainerSettings.json';
import { EmployeeFactory } from 'tests/modules/employees/domain/EmployeeFactory';

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

  beforeEach(async () => {
    await setup.cleanTable("Employees"); 
  });

  describe('create', () => {
    it('Should insert an employee into the database', async () => {
      const employeeToCreate = EmployeeFactory.fromPrimitives(
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

  describe('get', () => {
    it('Should recover the employee', async () => {
      const alreadyExistEmployee = {
        id: '550E8400-E29B-41D4-A716-446655440000',
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: '1985-03-15',
      };
      await setup.executeQuery(
        `INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth) 
        VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)`,
        {
          id: alreadyExistEmployee.id,
          firstName: alreadyExistEmployee.firstName,
          lastName: alreadyExistEmployee.lastName,
          documentNumber: alreadyExistEmployee.documentNumber,
          dateOfBirth: new Date(alreadyExistEmployee.dateOfBirth)
        }
      );
    
      const employee = await repository.getBy(alreadyExistEmployee.id);

      const expectedEmployee = EmployeeFactory.fromPrimitives(
        alreadyExistEmployee.id,
        alreadyExistEmployee.firstName,
        alreadyExistEmployee.lastName,
        alreadyExistEmployee.documentNumber,
        alreadyExistEmployee.dateOfBirth,
      );
      expect(employee).toMatchObject(expectedEmployee);
    });

    it('should return a null when employee not exists', async () => {
      const employee = await repository.getBy('220E2200-E29B-41D4-A716-442255440000');

      expect(employee).toBe(null);
    })
  });
});
