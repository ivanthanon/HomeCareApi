import { SeverityNumber } from '@opentelemetry/api-logs';
import { describe, expect, it, vi } from 'vitest';
import { LoggingCommandHandler } from 'src/modules/employees/application/decorators/loggingCommandHandler';
import { CommandHandler } from 'src/modules/employees/application/ports/commandHandler';
import { Err } from 'src/modules/employees/domain/shared/result';
import { LoggerFake } from 'tests/doubles/fake/LoggerFake';

class RegisterCommand {}

describe('When a command returns an error Result', () => {
  it('should log the error', async () => {
    const failure = Err(new Error('Invalid registration'));
    const command = new RegisterCommand();
    const execute = vi
      .fn<CommandHandler<RegisterCommand, void>['execute']>()
      .mockResolvedValue(failure);
    const logger = new LoggerFake();

    const result = await new LoggingCommandHandler({ execute }, logger).execute(
      command,
    );

    expect(execute).toHaveBeenCalledExactlyOnceWith(command);
    expect(result).toBe(failure);
    expect(logger.records).toEqual([
      {
        eventName: 'command.result.error',
        severityNumber: SeverityNumber.WARNING,
        severityText: 'WARNING',
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