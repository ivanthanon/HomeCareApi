import { expect } from 'vitest';
import { DomainEvent } from 'src/modules/employees/domain/shared/domainevent';

export function assertEvent<T extends DomainEvent>(
  actual: T,
  expected: T,
): void {
  expect(actual).toEqual(expected);
}

export function assertOutboxEventInMemory(
  events: any[],
  expectedEvent: Record<string, unknown>,
): void {
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual(expectedEvent);
}

export function assertOutboxMessageInDatabase(
  recordset: any[],
  expected: {
    type: string;
    aggregateId: string;
    aggregateType: string;
    payload: Record<string, unknown>;
  },
): void {
  expect(recordset).toHaveLength(1);
  const outboxMessage = recordset[0];
  expect(outboxMessage.type).toBe(expected.type);
  expect(outboxMessage.aggregateId).toBe(expected.aggregateId);
  expect(outboxMessage.aggregateType).toBe(expected.aggregateType);
  expect(outboxMessage.processed).toBe(false);
  expect(outboxMessage.processedAt).toBeNull();

  const payload = JSON.parse(outboxMessage.payload as string);
  expect(payload).toEqual(expected.payload);
}
