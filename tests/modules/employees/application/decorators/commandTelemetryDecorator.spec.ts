import { SeverityNumber } from '@opentelemetry/api-logs';
import { describe, expect, it } from 'vitest';
import { CommandTelemetryDecorator } from 'src/modules/employees/application/decorators/commandTelemetryDecorator';
import {
  CreateEmployeeCommand,
  CreateEmployeeCommandHandler,
} from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { OpenTelemetryLogger } from 'src/modules/employees/infrastructure/adapters/openTelemetryLogger';
import { EmployeeInMemoryRepository } from 'tests/doubles/fake/EmployeeInMemoryRepository';
import { LoggerFake } from 'tests/doubles/fake/LoggerFake';
import { OutboxInMemoryRepository } from 'tests/doubles/fake/OutboxInMemoryRepository';
import { DateClockStub } from 'tests/doubles/stub/dateClockStub';

const createHandler = () =>
  new CreateEmployeeCommandHandler(
    new EmployeeInMemoryRepository(),
    new OutboxInMemoryRepository(),
    { execute: (work) => work() },
    new DateClockStub(),
    { getAgeOfMajority: () => 18 },
  );

const createCommand = (dateOfBirth: Date) =>
  new CreateEmployeeCommand(
    '550E8400-E29B-41D4-A716-446655440000',
    'María',
    'García López',
    '12345678A',
    dateOfBirth,
  );

describe('When a command returns an error Result', () => {
  it('should log the error', async () => {
    const logger = new LoggerFake();

    const result = await new CommandTelemetryDecorator(
      createHandler(),
      new OpenTelemetryLogger(logger),
    ).execute(createCommand(new Date('2026-02-10T00:00:00.000Z')));

    expect(result).toEqual({
      success: false,
      error: new Error('Employee must be an adult'),
    });
    expect(logger.records).toEqual([
      {
        eventName: 'command.result.error',
        severityNumber: SeverityNumber.WARN,
        severityText: 'WARN',
        body: 'Employee must be an adult',
        attributes: {
          'command.name': 'CreateEmployeeCommand',
          'exception.type': 'Error',
          'exception.message': 'Employee must be an adult',
        },
      },
    ]);
  });

  it('should preserve the error Result when logging fails', async () => {
    class FailingLoggerFake extends LoggerFake {
      override emit(): void {
        throw new Error('Logging failed');
      }
    }
    const fakeFailingLogger = new FailingLoggerFake();

    const result = await new CommandTelemetryDecorator(
      createHandler(),
      new OpenTelemetryLogger(fakeFailingLogger),
    ).execute(createCommand(new Date('2026-02-10T00:00:00.000Z')));

    expect(result).toEqual({
      success: false,
      error: new Error('Employee must be an adult'),
    });
    expect(fakeFailingLogger.records).toHaveLength(0);
  });
});

describe('When a command succeeds', () => {
  it('should not log a record', async () => {
    const logger = new LoggerFake();

    const result = await new CommandTelemetryDecorator(
      createHandler(),
      new OpenTelemetryLogger(logger),
    ).execute(createCommand(new Date('1985-03-15T00:00:00.000Z')));

    expect(result).toEqual({ success: true, value: undefined });
    expect(logger.records).toHaveLength(0);
  });
});
