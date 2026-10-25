import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';

const resource = resourceFromAttributes({
  'service.name': process.env.OTEL_SERVICE_NAME || 'homecare-api',
  'service.version': process.env.OTEL_SERVICE_VERSION || 'unknown',
});

const traceExporter = new OTLPTraceExporter();

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter(),
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReaders: [metricReader],
  logRecordProcessors: [
    new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() }),
  ],
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

export function shutdownTelemetry(): Promise<void> {
  return sdk.shutdown();
}
