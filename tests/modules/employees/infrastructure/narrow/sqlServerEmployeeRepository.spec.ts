import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { TestcontainerSetup } from 'tests/base/testcontainer-setup';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerEmployeeRepository';
import { SqlServerTransactionScope } from 'src/modules/employees/infrastructure/adapters/sqlServerTransactionScope';
import testContainerSettings from 'tests/base/testContainerSettings.json';
import { Employee } from 'src/modules/employees/domain/employee';

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
    const transactionScope = new SqlServerTransactionScope(setup.dbConnection);
    repository = new SqlServerEmployeeRepository(transactionScope);
  }, 60000);

  afterAll(async () => {
    await setup.stop();
  });

  beforeEach(async () => {
    await setup.cleanTable("Employees"); 
  });

  describe('create', () => {
    it('Should insert an employee into the database', async () => {
      const employeeToCreate = Employee.reconstitute(
        '550E8400-E29B-41D4-A716-446655440000',
        'María',
        'García López',
        '12345678A',
        new Date('1985-03-15T00:00:00Z'),
      );
    
      await repository.create(employeeToCreate);

      const result = await setup.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: employeeToCreate.id.value },
      );
      expect(result.recordset).toHaveLength(1);
      const fromDb = result.recordset[0];
      expect(fromDb).toEqual({
        id: employeeToCreate.id.value,
        firstName: employeeToCreate.firstName.value,
        lastName: employeeToCreate.lastName.value,
        documentNumber: employeeToCreate.documentNumber.value,
        dateOfBirth: employeeToCreate.dateOfBirth.value
      });
    });
  });

  describe('get', () => {
    it('Should recover the employee', async () => {
      const alreadyExistEmployee = {
        id: '550E8400-E29B-41D4-A716-446655440000',
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: new Date('1985-03-15'),
      };
      await setup.executeQuery(
        `INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth) 
        VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)`,
        {
          id: alreadyExistEmployee.id,
          firstName: alreadyExistEmployee.firstName,
          lastName: alreadyExistEmployee.lastName,
          documentNumber: alreadyExistEmployee.documentNumber,
          dateOfBirth: alreadyExistEmployee.dateOfBirth
        }
      );
    
      const employee = await repository.getBy(alreadyExistEmployee.id);

      const expectedEmployee = Employee.reconstitute(
        alreadyExistEmployee.id,
        alreadyExistEmployee.firstName,
        alreadyExistEmployee.lastName,
        alreadyExistEmployee.documentNumber,
        alreadyExistEmployee.dateOfBirth,
      );
      expect(employee).toEqual(expectedEmployee);
    });

    it('should return a null when employee not exists', async () => {
      const employee = await repository.getBy('220E2200-E29B-41D4-A716-442255440000');

      expect(employee).toBe(null);
    })
  });
});
