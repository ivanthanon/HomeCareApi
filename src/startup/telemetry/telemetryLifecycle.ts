import { OnApplicationShutdown } from '@nestjs/common';
import { shutdownTelemetry } from './telemetryStartup';

export class TelemetryLifecycle implements OnApplicationShutdown {
  onApplicationShutdown(): Promise<void> {
    return shutdownTelemetry();
  }
}
