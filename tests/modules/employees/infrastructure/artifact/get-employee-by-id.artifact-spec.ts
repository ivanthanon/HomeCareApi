import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import request from 'supertest';
import { ArtifactTestBase } from 'tests/base/artifact-test.base';

describe('Employees E2E - Get Employee By ID Acceptance Test', () => {
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
    await testCase.cleanTable('outboxMessages');
    await testCase.cleanTable('employees');
  });

  describe('when the employee exists', () => {
    it('should return the employee details', async () => {
      const employee = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: new Date('1985-03-15T00:00:00.000Z'),
      };
      await testCase.executeQuery(
        `INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
         VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)`,
        employee,
      );

      await request(testCase['app'].getHttpServer())
        .get(`${path}/${employee.id}`)
        .expect(200)
        .expect({
          ...employee,
          dateOfBirth: employee.dateOfBirth.toISOString(),
        });
    });
  });

  describe('when the employee does not exist', () => {
    it('should return 404 Not Found', async () => {
      await request(testCase['app'].getHttpServer())
        .get(`${path}/550e8400-e29b-41d4-a716-446655440000`)
        .expect(404)
        .expect({
          error: 'Not Found',
          message:
            'Employee with id 550e8400-e29b-41d4-a716-446655440000 was not found',
          statusCode: 404,
        });
    });
  });
});
