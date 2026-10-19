import { CommandHandler } from 'src/modules/employees/application/ports/commandHandler';
import { ForLogging } from 'src/modules/employees/application/ports/forLogging';
import { Result } from 'src/modules/employees/domain/shared/result';

export class CommandTelemetryDecorator<
  Command,
  Value,
> implements CommandHandler<Command, Value> {
  constructor(
    private readonly handler: CommandHandler<Command, Value>,
    private readonly logger: ForLogging,
  ) {}

  async execute(command: Command): Promise<Result<Value, Error>> {
    const result = await this.handler.execute(command);

    if (!result.success) {
      try {
        this.logger.log((command as object).constructor.name, result.error);
      } catch {
        // If logging fails, we don't want to throw an error and break the application flow.
      }
    }

    return result;
  }
}