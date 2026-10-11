import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import request from 'supertest';
import { ArtifactTestBase } from 'tests/base/artifact-test.base';
import { assertOutboxMessageInDatabase } from 'tests/helpers/assert/OutboxTestHelper';
import { EmployeeDeletedV1 } from 'src/modules/employees/domain/events/EmployeeDeletedV1';

describe('Employees E2E - Delete Employee Acceptance Test', () => {
  class EmployeesArtifactTest extends ArtifactTestBase { }

  let testCase: EmployeesArtifactTest;

  const existingEmployee = {
    id: '550E8400-E29B-41D4-A716-446655440000',
    firstName: 'María',
    lastName: 'García López',
    documentNumber: '12345678A',
    dateOfBirth: '1985-03-15T00:00:00.000Z',
  };

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

  const insertEmployee = async () => {
    await testCase.executeQuery(
      `INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
       VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)`,
      {
        id: existingEmployee.id,
        firstName: existingEmployee.firstName,
        lastName: existingEmployee.lastName,
        documentNumber: existingEmployee.documentNumber,
        dateOfBirth: new Date(existingEmployee.dateOfBirth),
      },
    );
  };

  describe('when deleting an existing employee', () => {
    it('should soft delete the employee and publish EmployeeDeleted.v1', async () => {
      await insertEmployee();

      await request(testCase['app'].getHttpServer())
        .delete(`/employees/${existingEmployee.id}`)
        .expect(204);

      const query = await testCase.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: existingEmployee.id },
      );
      expect(query.recordset).toHaveLength(1);
      expect(query.recordset[0].deletedAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));

      const outboxQuery = await testCase.executeQuery(
        'SELECT * FROM outboxMessages WHERE aggregateId = @id',
        { id: existingEmployee.id },
      );

      assertOutboxMessageInDatabase(outboxQuery.recordset, {
        aggregateId: existingEmployee.id,
        aggregateType: 'Employee',
        event: new EmployeeDeletedV1(
          existingEmployee.id,
          new Date('2026-01-01T00:00:00.000Z'),
        ),
      });
    });
  });

  describe('when the employee does not exist', () => {
    it('should return a 404 Not Found and publish nothing', async () => {
      const response = await request(testCase['app'].getHttpServer())
        .delete(`/employees/${existingEmployee.id}`)
        .expect(404);

      expect(response.body.message).toBe('Employee not found');

      const outboxQuery = await testCase.executeQuery(
        'SELECT * FROM outboxMessages WHERE aggregateId = @id',
        { id: existingEmployee.id },
      );
      expect(outboxQuery.recordset).toHaveLength(0);
    });
  });

  describe('when the id is not a valid guid', () => {
    it('should return a 400 Bad Request', async () => {
      const response = await request(testCase['app'].getHttpServer())
        .delete('/employees/not-a-guid')
        .expect(400);

      expect(response.body.message).toBe('Employee id must be a valid guid');
    });
  });
});
