import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { TestcontainerSetup } from 'tests/base/testcontainer-setup';
import { SqlServerTransactionScope } from 'src/modules/employees/infrastructure/adapters/sqlServerTransactionScope';
import testContainerSettings from 'tests/base/testContainerSettings.json';
import { UniqueIdentifier, NVarChar, Date as SqlDate } from 'mssql';

class SqlServerTransactionScopeTest extends TestcontainerSetup {
  constructor() {
    super(testContainerSettings);
  }
}

describe('SqlServerTransactionScope', () => {
  const setup = new SqlServerTransactionScopeTest();
  let transactionScope: SqlServerTransactionScope;

  beforeAll(async () => {
    await setup.startDatabaseTestContainer();
    transactionScope = new SqlServerTransactionScope(setup.dbConnection);
  }, 60000);

  afterAll(async () => {
    await setup.stop();
  });

  beforeEach(async () => {
    await setup.cleanTable('Employees');
  });

  describe('commit', () => {
    it('should persist data when transaction commits successfully', async () => {
      const employeeId = '550E8400-E29B-41D4-A716-446655440000';

      await transactionScope.execute(async () => {
        await transactionScope.getRequest()
          .input('id', UniqueIdentifier, employeeId)
          .input('firstName', NVarChar, 'María')
          .input('lastName', NVarChar, 'García López')
          .input('documentNumber', NVarChar, '12345678A')
          .input('dateOfBirth', SqlDate, new Date('1985-03-15T00:00:00Z'))
          .query(`
            INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
            VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
          `);
      });

      const result = await setup.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: employeeId }
      );

      expect(result.recordset).toHaveLength(1);
      expect(result.recordset[0].id).toBe(employeeId);
    });

    it('should return the value produced by the work function', async () => {
      const employeeId = '550E8400-E29B-41D4-A716-446655440000';

      await setup.executeQuery(
        `INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
         VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)`,
        {
          id: employeeId,
          firstName: 'María',
          lastName: 'García López',
          documentNumber: '12345678A',
          dateOfBirth: new Date('1985-03-15T00:00:00Z'),
        }
      );

      const result = await transactionScope.execute(async () => {
        const fetched = await transactionScope.getRequest()
          .input('id', UniqueIdentifier, employeeId)
          .query('SELECT firstName, lastName FROM employees WHERE id = @id');

        return fetched.recordset[0];
      });

      expect(result).toEqual({ firstName: 'María', lastName: 'García López' });
    });
  });

  describe('rollback', () => {
    it('should not persist data when transaction throws an error', async () => {
      const employeeId = '550E8400-E29B-41D4-A716-446655440000';

      await expect(
        transactionScope.execute(async () => {
          await transactionScope.getRequest()
            .input('id', UniqueIdentifier, employeeId)
            .input('firstName', NVarChar, 'María')
            .input('lastName', NVarChar, 'García López')
            .input('documentNumber', NVarChar, '12345678A')
            .input('dateOfBirth', SqlDate, new Date('1985-03-15T00:00:00Z'))
            .query(`
              INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
              VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
            `);

          throw new Error('Simulated failure');
        })
      ).rejects.toThrow('Simulated failure');

      const result = await setup.executeQuery(
        'SELECT * FROM employees WHERE id = @id',
        { id: employeeId }
      );

      expect(result.recordset).toHaveLength(0);
    });

    it('should propagate the original error after rollback', async () => {
      await expect(
        transactionScope.execute(async () => {
          throw new Error('Domain validation failed');
        })
      ).rejects.toThrow('Domain validation failed');
    });
  });

  describe('nested operations within a single transaction', () => {
    it('should commit all operations atomically when all succeed', async () => {
      const id1 = '550E8400-E29B-41D4-A716-446655440000';
      const id2 = '660E8400-E29B-41D4-A716-446655440001';

      await transactionScope.execute(async () => {
        await transactionScope.getRequest()
          .input('id', UniqueIdentifier, id1)
          .input('firstName', NVarChar, 'María')
          .input('lastName', NVarChar, 'García López')
          .input('documentNumber', NVarChar, '12345678A')
          .input('dateOfBirth', SqlDate, new Date('1985-03-15T00:00:00Z'))
          .query(`
            INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
            VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
          `);

        await transactionScope.getRequest()
          .input('id', UniqueIdentifier, id2)
          .input('firstName', NVarChar, 'Juan')
          .input('lastName', NVarChar, 'Pérez')
          .input('documentNumber', NVarChar, '87654321B')
          .input('dateOfBirth', SqlDate, new Date('1990-07-20T00:00:00Z'))
          .query(`
            INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
            VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
          `);
      });

      const result = await setup.executeQuery('SELECT * FROM employees');
      expect(result.recordset).toHaveLength(2);
    });

    it('should rollback all operations when one fails', async () => {
      const id1 = '550E8400-E29B-41D4-A716-446655440000';
      const id2 = '660E8400-E29B-41D4-A716-446655440001';

      await expect(
        transactionScope.execute(async () => {
          await transactionScope.getRequest()
            .input('id', UniqueIdentifier, id1)
            .input('firstName', NVarChar, 'María')
            .input('lastName', NVarChar, 'García López')
            .input('documentNumber', NVarChar, '12345678A')
            .input('dateOfBirth', SqlDate, new Date('1985-03-15T00:00:00Z'))
            .query(`
              INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
              VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
            `);

          await transactionScope.getRequest()
            .input('id', UniqueIdentifier, id2)
            .input('firstName', NVarChar, 'Juan')
            .input('lastName', NVarChar, 'Pérez')
            .input('documentNumber', NVarChar, '87654321B')
            .input('dateOfBirth', SqlDate, new Date('1990-07-20T00:00:00Z'))
            .query(`
              INSERT INTO employees (id, firstName, lastName, documentNumber, dateOfBirth)
              VALUES (@id, @firstName, @lastName, @documentNumber, @dateOfBirth)
            `);

          throw new Error('Second operation failed');
        })
      ).rejects.toThrow('Second operation failed');

      const result = await setup.executeQuery('SELECT * FROM employees');
      expect(result.recordset).toHaveLength(0);
    });
  });
});
