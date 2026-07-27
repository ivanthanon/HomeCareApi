import { IMigration } from '../IMigration';

export const migration: IMigration = {
  async up(request) {
    await request.batch(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'outboxMessages')
      BEGIN
        CREATE TABLE outboxMessages (
            id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
            [type] NVARCHAR(255) NOT NULL,
            aggregateId UNIQUEIDENTIFIER NOT NULL,
            aggregateType NVARCHAR(255) NOT NULL,
            payload NVARCHAR(MAX) NOT NULL,
            traceId NVARCHAR(50) NULL,
            createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
            processed BIT NOT NULL DEFAULT 0,
            processedAt DATETIME2 NULL
        );

        CREATE INDEX idx_outboxMessages_processed_createdAt
            ON outboxMessages (processed, createdAt)
            WHERE processed = 0;
      END
    `);
  },

  async down(request) {
    await request.batch(`
      DROP TABLE IF EXISTS outboxMessages;
    `);
  }
};
