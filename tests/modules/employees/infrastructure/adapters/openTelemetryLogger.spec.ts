import { SeverityNumber } from '@opentelemetry/api-logs';
import { describe, expect, it } from 'vitest';
import { OpenTelemetryLogger } from 'src/modules/employees/infrastructure/adapters/openTelemetryLogger';
import { LoggerFake } from 'tests/doubles/fake/LoggerFake';

describe('When a command failure is logged', () => {
  it('should emit an OpenTelemetry warning with command and error information', () => {
    const logger = new LoggerFake();

    new OpenTelemetryLogger(logger).log(
      'RegisterCommand',
      new Error('Invalid registration'),
    );

    expect(logger.records).toEqual([
      {
        eventName: 'command.result.error',
        severityNumber: SeverityNumber.WARN,
        severityText: 'WARN',
        body: 'Invalid registration',
        attributes: {
          'command.name': 'RegisterCommand',
          'exception.type': 'Error',
          'exception.message': 'Invalid registration',
        },
      },
    ]);
  });
});
