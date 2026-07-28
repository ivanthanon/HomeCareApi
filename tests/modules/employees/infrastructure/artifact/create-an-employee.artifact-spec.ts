import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import request from 'supertest';
import { ArtifactTestBase } from 'tests/base/artifact-test.base';
import { assertOutboxMessageInDatabase } from 'tests/base/helpers/OutboxTestHelper';
import { EmployeeCreatedV1 } from 'src/modules/employees/domain/events/EmployeeCreatedV1';

describe('Employees E2E - Create Employee Acceptance Test', () => {
  class EmployeesArtifactTest extends ArtifactTestBase { }

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
    await testCase.cleanTable('outboxMessages');
    await testCase.cleanTable('employees');
  });

  describe('when creating a valid employee', () => {
    it('should persist the employee in the database', async () => {
      const employee = {
        id: '550E8400-E29B-41D4-A716-446655440000',
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: '1985-03-15T00:00:00.000Z',
      };

      await request(testCase['app'].getHttpServer())
        .post(path)
        .send(employee)
        .expect(201);

      const query = await testCase.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: employee.id },
      );
      expect(query.recordset).toHaveLength(1);
      const employeeFromDatabase = query.recordset[0];
      expect(employeeFromDatabase).toEqual({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        documentNumber: employee.documentNumber,
        dateOfBirth: new Date(employee.dateOfBirth)
      });

      const outboxQuery = await testCase.executeQuery(
        'SELECT * FROM outboxMessages WHERE aggregateId = @id',
        { id: employee.id },
      );

      assertOutboxMessageInDatabase(outboxQuery.recordset, {
        aggregateId: employee.id,
        aggregateType: 'Employee',
        event: new EmployeeCreatedV1(
          employee.id,
          employee.firstName,
          employee.lastName,
          employee.documentNumber,
          new Date(employee.dateOfBirth),
          new Date('2026-01-01T00:00:00.000Z'),
        ),
      });
    });
  });

  describe('when employee is not an adult', () => {
    it('should return a 400 Bad Request error', async () => {
      const employee = {
        id: '550E8400-E29B-41D4-A716-446655330000',
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: '2026-02-10',
      };

      const response = await request(testCase['app'].getHttpServer())
        .post(path)
        .send(employee)
        .expect(400);

      const expectedResponse = {
        "error": "Bad Request",
        "message": "Employee must be an adult",
        "statusCode": 400,
      }
      expect(response.body).toStrictEqual(expectedResponse);
      const query = await testCase.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: employee.id },
      );
      expect(query.recordset).toHaveLength(0);
    });
  });

  describe('when employee already exists', () => {
    it('should return 201 created and dont duplicate it', async () => {
      const alreadyExistEmployee = {
        id: '550E8400-E29B-41D4-A716-446655440000',
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: '1985-03-15',
      };
      await testCase.executeQuery(
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


      await request(testCase['app'].getHttpServer())
        .post(path)
        .send(alreadyExistEmployee)
        .expect(201);

      const query = await testCase.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: alreadyExistEmployee.id },
      );
      expect(query.recordset).toHaveLength(1);
      const employeeFromDatabase = query.recordset[0];
      expect(employeeFromDatabase).toEqual({
        id: alreadyExistEmployee.id,
        firstName: alreadyExistEmployee.firstName,
        lastName: alreadyExistEmployee.lastName,
        documentNumber: alreadyExistEmployee.documentNumber,
        dateOfBirth: new Date(alreadyExistEmployee.dateOfBirth)
      });
    });
  });
});