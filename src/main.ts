import { NestFactory } from '@nestjs/core';
import { ConnectionPool } from 'mssql';
import { config as loadDotenv } from 'dotenv';
import { resolve } from 'path';
import { EmployeesModule } from './employees.module';
import { MigrationRunner } from './modules/employees/infrastructure/database/migrationRunner';

loadDotenv({ path: resolve(process.cwd(), '.env') });

function dbConfig() {
  return {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '1433', 10),
    database: process.env.DB_NAME || 'HomeCare',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'HomeCare2025',
    options: { encrypt: true, trustServerCertificate: true },
  };
}

async function bootstrap() {
  const config = dbConfig();
  const pool = new ConnectionPool(config);
  await pool.connect();

  const migrationRunner = new MigrationRunner(pool, config);
  await migrationRunner.runMigrations();
  await pool.close();

  const app = await NestFactory.create(EmployeesModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();