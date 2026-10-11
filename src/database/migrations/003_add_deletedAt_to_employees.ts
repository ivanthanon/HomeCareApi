import { IMigration } from '../IMigration';

export const migration: IMigration = {
  async up(request) {
    await request.batch(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'employees' AND COLUMN_NAME = 'deletedAt'
      )
      BEGIN
        ALTER TABLE employees ADD deletedAt DATETIME2 NULL;
      END
    `);
  },

  async down(request) {
    await request.batch(`
      IF EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'employees' AND COLUMN_NAME = 'deletedAt'
      )
      BEGIN
        ALTER TABLE employees DROP COLUMN deletedAt;
      END
    `);
  }
};
