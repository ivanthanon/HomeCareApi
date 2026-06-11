import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import request from 'supertest';
import { AcceptanceTestBase } from './base/acceptance-test.base';

describe('Employees E2E - Create Employee Acceptance Test', () => {
  class EmployeesAcceptanceTest extends AcceptanceTestBase {}

  let testCase: EmployeesAcceptanceTest;
  const path = '/employees';

  beforeAll(async () => {
    testCase = new EmployeesAcceptanceTest();
    await testCase.setupDatabase();
    await testCase.setupApplication();
  }, 60000);

  afterAll(async () => {
    await testCase.teardown();
  });

  afterEach(async () => {
    await testCase.cleanAllTables();
  });

  describe('create_a_employee', () => {
    it('Should create an employee', async () => {
      const newEmployee = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: '1985-03-15',
      };

      await request(testCase['app'].getHttpServer())
        .post(path)
        .send(newEmployee)
        .expect(201);
      
      const result = await testCase['dbConnection']
        .request()
        .input('id', newEmployee.id)
        .query('SELECT * FROM employees WHERE id = @id');
      expect(result.recordset).toHaveLength(1);
      const employeeFromDb = result.recordset[0];
      expect(employeeFromDb.firstName).toBe(newEmployee.firstName);
      expect(employeeFromDb.lastName).toBe(newEmployee.lastName);
      expect(employeeFromDb.documentNumber).toBe(newEmployee.documentNumber);
      expect(employeeFromDb.dateOfBirth).toBe(newEmployee.dateOfBirth);
    });
  });
});