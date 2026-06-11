import { IMigration } from '../IMigration';

export const migration: IMigration = {
  async up(request) {
    await request.batch(`
      CREATE TABLE employees (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          firstName NVARCHAR(255) NOT NULL,
          lastName NVARCHAR(255) NOT NULL,
          documentNumber NVARCHAR(50) UNIQUE NOT NULL,
          dateOfBirth DATE NOT NULL,
          createdAt DATETIME2 DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 DEFAULT GETUTCDATE()
      );

      CREATE INDEX idx_employees_document ON employees(documentNumber);
      CREATE INDEX idx_employees_created_at ON employees(createdAt);
    `);
  },

  async down(request) {
    await request.batch(`
      DROP INDEX IF EXISTS idx_employees_created_at ON employees;
      DROP INDEX IF EXISTS idx_employees_document ON employees;
      DROP TABLE IF EXISTS employees;
    `);
  }
};