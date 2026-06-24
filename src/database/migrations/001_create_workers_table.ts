import { IMigration } from '../IMigration';

export const migration: IMigration = {
  async up(request) {
    await request.batch(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'employees')
      BEGIN
        CREATE TABLE employees (
            id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
            firstName NVARCHAR(255) NOT NULL,
            lastName NVARCHAR(255) NOT NULL,
            documentNumber NVARCHAR(50) UNIQUE NOT NULL,
            dateOfBirth DATE NOT NULL,
        );

        CREATE INDEX idx_employees_document ON employees(documentNumber);
      END
    `);
  },

  async down(request) {
    await request.batch(`
      DROP TABLE IF EXISTS employees;
    `);
  }
};