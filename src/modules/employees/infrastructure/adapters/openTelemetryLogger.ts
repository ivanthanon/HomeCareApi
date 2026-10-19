import { Logger, SeverityNumber } from '@opentelemetry/api-logs';
import { ForLoggingCommandFailures } from 'src/modules/employees/application/ports/forLoggingCommandFailures';

export class OpenTelemetryLogger implements ForLoggingCommandFailures {
  constructor(private readonly logger: Logger) {}

  log(commandName: string, error: Error): void {
    this.logger.emit({
      eventName: 'command.result.error',
      severityNumber: SeverityNumber.WARN,
      severityText: 'WARN',
      body: error.message,
      attributes: {
        'command.name': commandName,
        'exception.type': error.constructor.name,
        'exception.message': error.message,
      },
    });
  }
}
