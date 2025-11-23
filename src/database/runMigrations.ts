import { connectToDatabase, pool } from './connection';
import { MigrationRunner } from './migrationRunner';

async function run() {
  const command = process.argv[2] || 'up';

  try {
    await connectToDatabase();
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
