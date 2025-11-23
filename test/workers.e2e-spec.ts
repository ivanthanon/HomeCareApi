import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import request from 'supertest';
import { AcceptanceTestBase } from './support/acceptance-test.base';

describe('Workers E2E - Create Worker Acceptance Test', () => {
  class WorkersAcceptanceTest extends AcceptanceTestBase {}

  let testCase: WorkersAcceptanceTest;

  // Aumentar el timeout a 60 segundos (60000ms) para dar tiempo a Testcontainers
  // y a la inicialización de la aplicación Nest.
  beforeAll(async () => {
    testCase = new WorkersAcceptanceTest();
    await testCase.setupDatabase();
    await testCase.setupApplication();
  }, 60000); // <-- Timeout aumentado aquí

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
      expect(workerFromDb.firstName).toBe(newWorker.firstName);
      expect(workerFromDb.lastName).toBe(newWorker.lastName);
      expect(workerFromDb.documentNumber).toBe(newWorker.documentNumber);
      expect(workerFromDb.dateOfBirth).toBeDefined();
    });
  });
});