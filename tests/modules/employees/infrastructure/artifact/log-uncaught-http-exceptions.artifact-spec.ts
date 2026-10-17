import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  logs,
  Logger,
  LoggerProvider,
  LogRecord,
  SeverityNumber,
} from '@opentelemetry/api-logs';
import { Server } from 'node:http';
import { GetEmployeeByIdQueryHandler } from 'src/modules/employees/application/get-employee-by-id/getEmployeeByIdQueryHandler';
import { ArtifactTestBase } from 'tests/base/artifact-test.base';

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

class ThrowingGetEmployeeByIdQueryHandler extends GetEmployeeByIdQueryHandler {
  constructor(private readonly error: Error) {
    super(null as never);
  }

  execute(): Promise<never> {
    return Promise.reject(this.error);
  }
}

describe('Employees HTTP exception logging acceptance test', () => {
  class EmployeesArtifactTest extends ArtifactTestBase {
    protected getEmployeeByIdQueryHandlerOverride(): GetEmployeeByIdQueryHandler {
      return new ThrowingGetEmployeeByIdQueryHandler(error);
    }
  }

  let testCase: EmployeesArtifactTest;
  const logger = new LoggerFake();
  const error = new Error('Database connection failed');

  beforeAll(async () => {
    logs.setGlobalLoggerProvider(new LoggerProviderFake(logger));
    testCase = new EmployeesArtifactTest();
    await testCase.setupApplication();
  }, 60000);

  afterAll(async () => {
    await testCase.teardown();
  });

  it('should preserve the HTTP 500 response and emit its structured exception record', async () => {
    const response = await request(testCase['app'].getHttpServer() as Server)
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
