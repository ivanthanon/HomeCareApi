import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import request from 'supertest';
import { AcceptanceTestBase } from './support/acceptance-test.base';

describe('Workers E2E - Create Worker Acceptance Test', () => {
  class WorkersAcceptanceTest extends AcceptanceTestBase {}

  let testCase: WorkersAcceptanceTest;

  beforeAll(async () => {
    testCase = new WorkersAcceptanceTest();
    await testCase.setupDatabase();
    await testCase.setupApplication();
  });

  afterAll(async () => {
    await testCase.teardown();
  });

  afterEach(async () => {
    // Limpiar datos entre tests
    await testCase.cleanAllTables();
  });

  describe('create_a_worker', () => {
    it('Should create a worker via POST and verify it exists in the database', async () => {
      // Arrange
      const newWorker = {
        firstName: 'María',
        lastName: 'García López',
        documentNumber: '12345678A',
        dateOfBirth: '1985-03-15',
      };

      // Act - Hacer POST al endpoint
      const response = await request(testCase['app'].getHttpServer())
        .post('/workers')
        .send(newWorker)
        .expect(201);

      const workerId = response.body.id;

      // Assert - Verificar que existe en la BD
      const result = await testCase['dbConnection']
        .request()
        .input('id', workerId)
        .query('SELECT * FROM workers WHERE id = @id');

      expect(result.recordset).toHaveLength(1);
      
      const workerFromDb = result.recordset[0];
      expect(workerFromDb.first_name).toBe(newWorker.firstName);
      expect(workerFromDb.last_name).toBe(newWorker.lastName);
      expect(workerFromDb.document_number).toBe(newWorker.documentNumber);
      expect(workerFromDb.date_of_birth).toBeDefined();
    });
  });
});
