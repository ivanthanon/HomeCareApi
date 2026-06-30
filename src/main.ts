import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConnectionPool } from 'mssql';
import { EmployeesModule } from './employees.module';
import { MigrationRunner } from './database/migrationRunner';


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
  const env = process.env.NODE_ENV || 'development';

  if (env === 'development') {
    await applyMigrations();
  }

  const app = await NestFactory.create(EmployeesModule);

  const config = new DocumentBuilder()
    .setTitle('HomeCare API')
    .setDescription('API for managing home care employees')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

async function applyMigrations() {
  const config = dbConfig();
  const pool = new ConnectionPool(config);
  await pool.connect();

  const migrationRunner = new MigrationRunner(pool);
  await migrationRunner.runMigrations();
  await pool.close();
}
