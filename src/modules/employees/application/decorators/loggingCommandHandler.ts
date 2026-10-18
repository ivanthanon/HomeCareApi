import { Logger, SeverityNumber } from '@opentelemetry/api-logs';
import { CommandHandler } from 'src/modules/employees/application/ports/commandHandler';
import { Result } from 'src/modules/employees/domain/shared/result';

export class LoggingCommandHandler<Command, Value> implements CommandHandler<
  Command,
  Value
> {
  constructor(
    private readonly handler: CommandHandler<Command, Value>,
    private readonly logger: Logger,
  ) {}

  async execute(command: Command): Promise<Result<Value, Error>> {
    const result = await this.handler.execute(command);

    if (!result.success) {
      try {
        this.logger.emit({
          eventName: 'command.result.error',
          severityNumber: SeverityNumber.ERROR,
          severityText: 'ERROR',
          body: result.error.message,
          attributes: {
            'command.name':
              command == null
                ? 'UnknownCommand'
                : (command as object).constructor.name,
            'exception.type': result.error.constructor.name,
            'exception.message': result.error.message,
          },
        });
      } catch {

      }
    }

    return result;
  }
}