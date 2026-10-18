import { Logger, LogRecord } from '@opentelemetry/api-logs';

export class LoggerFake implements Logger {
  readonly records: LogRecord[] = [];

  emit(logRecord: LogRecord): void {
    this.records.push(logRecord);
  }

  enabled(): boolean {
    return true;
  }

  reset(): void {
    this.records.length = 0;
  }
}