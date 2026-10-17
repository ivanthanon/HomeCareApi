import fs from 'fs';
import path from 'path';
import { ConnectionPool, Transaction } from 'mssql';
import { IMigration } from './IMigration';
export class MigrationRunner {
  private migrationsPath = path.join(__dirname, 'migrations');
  private migrationsTable = '__migrations__';
  private pool: ConnectionPool;

  constructor(pool: ConnectionPool) {
    if (!pool) {
      throw new Error(
        'MigrationRunner requires a mssql ConnectionPool instance',
      );
    }

    this.pool = pool;
  }

  async initialize(): Promise<void> {
    const request = this.pool.request();
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${this.migrationsTable}')
      BEGIN
        CREATE TABLE ${this.migrationsTable} (
          id INT PRIMARY KEY IDENTITY(1,1),
          name NVARCHAR(255) NOT NULL UNIQUE,
          executed_at DATETIME2 DEFAULT GETUTCDATE()
        )
      END
    `);
  }

  async runMigrations(): Promise<void> {
    await this.initialize();

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter(
        (file) =>
          (file.endsWith('.ts') || file.endsWith('.js')) &&
          !file.startsWith('IMigration'),
      )
      .sort();

    for (const file of files) {
      const executed = await this.isMigrationExecuted(file);

      if (!executed) {
        let transaction: Transaction | undefined;
        let transactionStarted = false;

        try {
          const filePath = path.join(this.migrationsPath, file);
          const { migration } = (await import(filePath)) as {
            migration: IMigration;
          };

          transaction = new Transaction(this.pool);
          await transaction.begin();
          transactionStarted = true;

          const request = transaction.request();
          await migration.up(request);
          await this.markMigrationAsExecuted(file, transaction);
          await transaction.commit();
          console.log(`✓ Migration up: ${file}`);
        } catch (error) {
          console.error(`✗ Migration failed: ${file}`, error);
          if (transactionStarted && transaction) {
            await transaction.rollback();
          }
          throw error;
        }
      }
    }

    console.log('All migrations completed');
  }

  async revertLastMigration(): Promise<void> {
    await this.initialize();

    const lastMigration = await this.getLastExecutedMigration();

    if (!lastMigration) {
      console.log('No migrations to revert');
      return;
    }

    let transaction: Transaction | undefined;
    let transactionStarted = false;

    try {
      const filePath = path.join(this.migrationsPath, lastMigration.name);
      const { migration } = (await import(filePath)) as {
        migration: IMigration;
      };

      transaction = new Transaction(this.pool);
      await transaction.begin();
      transactionStarted = true;

      const request = transaction.request();
      await migration.down(request);
      await this.unmarkMigration(lastMigration.name, transaction);
      await transaction.commit();
      console.log(`✓ Migration reverted: ${lastMigration.name}`);
    } catch (error) {
      console.error(`✗ Revert failed: ${lastMigration.name}`, error);
      if (transactionStarted && transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  private async isMigrationExecuted(name: string): Promise<boolean> {
    const request = this.pool.request();
    const result = await request
      .input('name', name)
      .query(`SELECT * FROM ${this.migrationsTable} WHERE name = @name`);

    return result.recordset.length > 0;
  }

  private async markMigrationAsExecuted(
    name: string,
    transaction: Transaction,
  ): Promise<void> {
    const request = transaction.request();
    await request
      .input('name', name)
      .query(`INSERT INTO ${this.migrationsTable} (name) VALUES (@name)`);
  }

  private async unmarkMigration(
    name: string,
    transaction: Transaction,
  ): Promise<void> {
    const request = transaction.request();
    await request
      .input('name', name)
      .query(`DELETE FROM ${this.migrationsTable} WHERE name = @name`);
  }

  private async getLastExecutedMigration(): Promise<{ name: string } | null> {
    const request = this.pool.request();
    const result = await request.query<{ name: string }>(`
      SELECT TOP 1 name FROM ${this.migrationsTable} ORDER BY executed_at DESC
    `);

    return result.recordset[0] || null;
  }
}
