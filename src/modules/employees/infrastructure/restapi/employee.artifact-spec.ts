import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import request from 'supertest';
import { Employee } from 'src/modules/employees/domain/entities/employee';
import { ArtifactTestBase } from 'testhelpers/base/artifact-test.base';

describe('Employees E2E - Create Employee Acceptance Test', () => {
  class EmployeesArtifactTest extends ArtifactTestBase {}

  let testCase: EmployeesArtifactTest;
  const path = '/employees';

  beforeAll(async () => {
    testCase = new EmployeesArtifactTest();
    await testCase.startDatabaseTestContainer();
    await testCase.setupApplication();
  }, 60000);

  afterAll(async () => {
    await testCase.teardown();
  });

  afterEach(async () => {
    await testCase.cleanTable('employees');
  });

  describe('create_a_employee', () => {
    it('Should create an employee', async () => {
      const employee = new Employee(
        '550E8400-E29B-41D4-A716-446655440000',
        'María',
        'García López',
        '12345678A',
        '1985-03-15',
      );

      await request(testCase['app'].getHttpServer())
        .post(path)
        .send({
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          documentNumber: employee.documentNumber,
          dateOfBirth: employee.dateOfBirth,
        })
        .expect(201);

      const result = await testCase.executeQuery(
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

  describe('Should not create a employee', () => {
    it('when is not an adult', async () => {
      const employee = new Employee(
        '550E8400-E29B-41D4-A716-446655440000',
        'María',
        'García López',
        '12345678A',
        '2026-02-10',
      );

      var response = await request(testCase['app'].getHttpServer())
        .post(path)
        .send({
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          documentNumber: employee.documentNumber,
          dateOfBirth: employee.dateOfBirth,
        })
        .expect(400);

      const expectedResponse = {
          "error": "Bad Request",
          "message": "Employee must be an adult",
          "statusCode": 400,
      }  
      expect(response.body).toStrictEqual(expectedResponse);
      const result = await testCase.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: employee.id },
      );
      expect(result.recordset).toHaveLength(0);
    });
  });
});