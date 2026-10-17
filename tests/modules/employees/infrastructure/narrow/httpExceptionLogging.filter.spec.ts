import { INestApplication } from '@nestjs/common';
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  logs,
  Logger,
  LoggerProvider,
  LogRecord,
  SeverityNumber,
} from '@opentelemetry/api-logs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Server } from 'node:http';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { GetEmployeeByIdQueryHandler } from 'src/modules/employees/application/get-employee-by-id/getEmployeeByIdQueryHandler';
import { EmployeesController } from 'src/modules/employees/infrastructure/restapi/create-employee/employee.controller';
import { HttpExceptionLoggingFilter } from 'src/modules/employees/infrastructure/restapi/httpExceptionLogging.filter';

class LoggerFake implements Logger {
  readonly records: LogRecord[] = [];

  emit(logRecord: LogRecord): void {
    this.records.push(logRecord);
  }

  enabled(): boolean {
    return true;
  }
}

class LoggerProviderFake implements LoggerProvider {
  constructor(private readonly logger: Logger) {}

  getLogger(): Logger {
    return this.logger;
  }
}

describe('HttpExceptionLoggingFilter', () => {
  let app: INestApplication;
  const logger = new LoggerFake();
  const error = new Error('Database connection failed');

  beforeAll(async () => {
    logs.setGlobalLoggerProvider(new LoggerProviderFake(logger));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: CreateEmployeeCommandHandler,
          useValue: { execute: () => Promise.resolve(undefined) },
        },
        {
          provide: GetEmployeeByIdQueryHandler,
          useValue: {
            execute: () => Promise.reject(error),
          },
        },
        {
          provide: APP_FILTER,
          useFactory: (httpAdapterHost: HttpAdapterHost) =>
            new HttpExceptionLoggingFilter(httpAdapterHost),
          inject: [HttpAdapterHost],
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    logs.disable();
  });

  it('should preserve the HTTP 500 response and emit its structured exception record', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/employees/550e8400-e29b-41d4-a716-446655440000')
      .expect(500);

    expect(response.body).toStrictEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.text).toBe(
      '{"statusCode":500,"message":"Internal server error"}',
    );
    expect(logger.records).toStrictEqual([
      {
        eventName: 'exception',
        severityNumber: SeverityNumber.ERROR,
        severityText: 'ERROR',
        body: error.message,
        exception: error,
        attributes: {
          'exception.type': 'Error',
          'exception.message': error.message,
          'exception.stacktrace': error.stack,
        },
      },
    ]);
  });
});