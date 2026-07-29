import { ConnectionPool } from 'mssql';
import { MigrationRunner } from './migrationRunner';
import appConfig from '../config/app.config';

async function run() {
  const command = process.argv[2] || 'up';
  const { database } = appConfig();
  const pool = new ConnectionPool(database);

  try {
    await pool.connect();
    const migrationRunner = new MigrationRunner(pool);

    if (command === 'up') {
      await migrationRunner.runMigrations();
    } else if (command === 'down') {
      await migrationRunner.revertLastMigration();
    } else {
      console.log('Usage: npm run migration [up|down]');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

run();
