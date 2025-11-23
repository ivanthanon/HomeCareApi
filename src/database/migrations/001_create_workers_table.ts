import { IMigration } from '../IMigration';

export const migration: IMigration = {
  async up(request) {
    await request.batch(`
      CREATE TABLE workers (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          firstName NVARCHAR(255) NOT NULL,
          lastName NVARCHAR(255) NOT NULL,
          documentNumber NVARCHAR(50) UNIQUE NOT NULL,
          dateOfBirth DATE NOT NULL,
          createdAt DATETIME2 DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 DEFAULT GETUTCDATE()
      );

      CREATE INDEX idx_workers_document ON workers(document_number);
      CREATE INDEX idx_workers_created_at ON workers(created_at);
    `);
  },

  async down(request) {
    await request.batch(`
      DROP INDEX IF EXISTS idx_workers_created_at ON workers;
      DROP INDEX IF EXISTS idx_workers_document ON workers;
      DROP TABLE IF EXISTS workers;
    `);
  }
};
