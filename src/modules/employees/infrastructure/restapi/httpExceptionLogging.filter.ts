import { ArgumentsHost, Catch } from '@nestjs/common';
import { HttpAdapterHost, BaseExceptionFilter } from '@nestjs/core';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

@Catch()
export class HttpExceptionLoggingFilter extends BaseExceptionFilter {
  private readonly logger = logs.getLogger('homecare-api.http-exceptions');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    try {
      const error = exception instanceof Error ? exception : undefined;
      const attributes: Record<string, string> = {};

      if (error) {
        attributes['exception.type'] = error.constructor.name;
        attributes['exception.message'] = error.message;
        if (error.stack) {
          attributes['exception.stacktrace'] = error.stack;
        }
      }

      this.logger.emit({
        eventName: 'exception',
        severityNumber: SeverityNumber.ERROR,
        severityText: 'ERROR',
        body: error?.message ?? String(exception),
        exception,
        attributes,
      });
    } catch {
      // Telemetry failures must not replace Nest's HTTP exception handling.
    }

    new BaseExceptionFilter(this.httpAdapterHost.httpAdapter).catch(
      exception,
      host,
    );
  }
}
