import './startup/telemetryStartup';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConnectionPool } from 'mssql';
import { EmployeesModule } from './employees.module';
import { MigrationRunner } from './database/migrationRunner';
import appConfig from './config/app.config';

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

  await app.listen(process.env.PORT ?? 3006);
}
bootstrap();

async function applyMigrations() {
  const { database } = appConfig();
  const pool = new ConnectionPool(database);
  await pool.connect();

  const migrationRunner = new MigrationRunner(pool);
  await migrationRunner.runMigrations();
  await pool.close();
}
