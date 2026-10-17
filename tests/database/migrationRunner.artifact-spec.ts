import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { MigrationRunner } from 'src/database/migrationRunner';
import {
  TestcontainerSetup,
  ITestContainerConfig,
} from 'tests/base/testcontainer-setup';
import testContainerSettings from 'tests/base/testContainerSettings.json';

function getErrorMessages(error: unknown): string {
  if (error instanceof Error) {
    const precedingErrors =
      'precedingErrors' in error && Array.isArray(error.precedingErrors)
        ? error.precedingErrors
            .map((entry: unknown) =>
              entry instanceof Error ? entry.message : String(entry),
            )
            .join(' ')
        : '';

    return `${error.message} ${precedingErrors}`;
  }

  return String(error);
}

describe('When applying a migration', () => {
  let database: TestcontainerSetup;
  const migrationName = '002_create_outbox_tables.ts';

  beforeAll(async () => {
    database = new TestcontainerSetup(testContainerSettings);
    await database.startDatabaseTestContainer();
  }, 60000);

  afterAll(async () => {
    if (database) await database.stop();
  }, 60000);

  beforeEach(async () => {
    await database.executeQuery('DROP TABLE IF EXISTS outboxMessages');
    await database.executeQuery(
      'DELETE FROM __migrations__ WHERE name = @name',
      { name: migrationName },
    );
    await database.executeQuery('DROP TRIGGER IF EXISTS fail_migration_record');
    await database.executeQuery(
      'DROP TRIGGER IF EXISTS fail_migration_unrecord',
    );
  });

  it('should apply the schema change and record the migration', async () => {
    await new MigrationRunner(database.dbConnection).runMigrations();

    const state = await database.executeQuery(
      `
      SELECT OBJECT_ID('outboxMessages', 'U') AS tableId,
             (SELECT COUNT(*) FROM __migrations__ WHERE name = @name) AS records
    `,
      { name: migrationName },
    );
    expect(state.recordset[0].tableId).not.toBeNull();
    expect(state.recordset[0].records).toBe(1);
  });

  it('should roll back the schema change when recording fails', async () => {
    await database.executeQuery(`
      CREATE TRIGGER fail_migration_record ON __migrations__
      INSTEAD OF INSERT
      AS
      BEGIN
        SET NOCOUNT ON;
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        RAISERROR ('Migration record failed', 16, 1);
      END
    `);

    const runner = new MigrationRunner(database.dbConnection);

    const error = await runner
      .runMigrations()
      .catch((reason: unknown) => reason);

    expect(getErrorMessages(error)).toMatch(
      /Migration record failed|Transaction has been aborted/i,
    );

    const failedState = await database.executeQuery(
      `
      SELECT OBJECT_ID('outboxMessages', 'U') AS tableId,
             (SELECT COUNT(*) FROM __migrations__ WHERE name = @name) AS records
    `,
      { name: migrationName },
    );
    expect(failedState.recordset[0].tableId).toBeNull();
    expect(failedState.recordset[0].records).toBe(0);
  });

  it('should roll back the revert when removing its record fails', async () => {
    const runner = new MigrationRunner(database.dbConnection);
    await runner.runMigrations();
    await database.executeQuery(`
      CREATE TRIGGER fail_migration_unrecord ON __migrations__
      INSTEAD OF DELETE
      AS
      BEGIN
        SET NOCOUNT ON;
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        RAISERROR ('Migration unrecord failed', 16, 1);
      END
    `);

    const error = await runner
      .revertLastMigration()
      .catch((reason: unknown) => reason);
    expect(getErrorMessages(error)).toMatch(
      /Migration unrecord failed|Transaction has been aborted/i,
    );

    const state = await database.executeQuery(
      `
      SELECT OBJECT_ID('outboxMessages', 'U') AS tableId,
             (SELECT COUNT(*) FROM __migrations__ WHERE name = @name) AS records
    `,
      { name: migrationName },
    );
    expect(state.recordset[0].tableId).not.toBeNull();
    expect(state.recordset[0].records).toBe(1);
  });
});
