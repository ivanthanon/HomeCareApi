import fs from 'fs';
import path from 'path';
import { pool } from './connection';
import { IMigration } from './IMigration';

export class MigrationRunner {
  private migrationsPath = path.join(__dirname, 'migrations');
  private migrationsTable = '__migrations__';

  async initialize(): Promise<void> {
    const request = pool.request();
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

    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.ts') && !file.startsWith('IMigration'))
      .sort();

    for (const file of files) {
      const executed = await this.isMigrationExecuted(file);
      
      if (!executed) {
        try {
          const filePath = path.join(this.migrationsPath, file);
          const { migration } = await import(filePath);
          
          const request = pool.request();
          await migration.up(request);
          
          await this.markMigrationAsExecuted(file);
          console.log(`✓ Migration up: ${file}`);
        } catch (error) {
          console.error(`✗ Migration failed: ${file}`, error);
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

    try {
      const filePath = path.join(this.migrationsPath, lastMigration.name);
      const { migration } = await import(filePath);
      
      const request = pool.request();
      await migration.down(request);
      
      await this.unmarkMigration(lastMigration.name);
      console.log(`✓ Migration reverted: ${lastMigration.name}`);
    } catch (error) {
      console.error(`✗ Revert failed: ${lastMigration.name}`, error);
      throw error;
    }
  }

  private async isMigrationExecuted(name: string): Promise<boolean> {
    const request = pool.request();
    const result = await request
      .input('name', name)
      .query(`SELECT * FROM ${this.migrationsTable} WHERE name = @name`);
    
    return result.recordset.length > 0;
  }

  private async markMigrationAsExecuted(name: string): Promise<void> {
    const request = pool.request();
    await request
      .input('name', name)
      .query(`INSERT INTO ${this.migrationsTable} (name) VALUES (@name)`);
  }

  private async unmarkMigration(name: string): Promise<void> {
    const request = pool.request();
    await request
      .input('name', name)
      .query(`DELETE FROM ${this.migrationsTable} WHERE name = @name`);
  }

  private async getLastExecutedMigration(): Promise<{ name: string } | null> {
    const request = pool.request();
    const result = await request.query(`
      SELECT TOP 1 name FROM ${this.migrationsTable} ORDER BY executed_at DESC
    `);
    
    return result.recordset[0] || null;
  }
}
