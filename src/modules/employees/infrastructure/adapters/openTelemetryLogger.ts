import { Logger, SeverityNumber } from '@opentelemetry/api-logs';
import { ForLogging } from 'src/modules/employees/application/ports/forLogging';

export class OpenTelemetryLogger implements ForLogging {
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
