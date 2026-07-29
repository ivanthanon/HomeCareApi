import { expect } from 'vitest';
import { DomainEvent } from 'src/modules/employees/domain/shared/domainevent';

interface OutboxMessageRecord {
  type: string;
  aggregateId: string;
  aggregateType: string;
  payload: string;
  processed: boolean;
  processedAt: Date | null;
}

export function assertEvent<T extends DomainEvent>(
  actual: T,
  expected: T,
): void {
  expect(actual).toEqual(expected);
}

export function assertOutboxEventInMemory<T extends DomainEvent>(
  events: T[],
  expectedEvent: T,
): void {
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual(expectedEvent);
}

export function assertOutboxMessageInDatabase<T extends DomainEvent>(
  recordset: OutboxMessageRecord[],
  expected: {
    aggregateId: string;
    aggregateType: string;
    event: T;
  },
): void {
  expect(recordset).toHaveLength(1);
  const outboxMessage = recordset[0];
  expect(outboxMessage.type).toBe(expected.event.eventName);
  expect(outboxMessage.aggregateId).toBe(expected.aggregateId);
  expect(outboxMessage.aggregateType).toBe(expected.aggregateType);
  expect(outboxMessage.processed).toBe(false);
  expect(outboxMessage.processedAt).toBeNull();

  const payload = JSON.parse(outboxMessage.payload as string);
  const expectedPayload = JSON.parse(JSON.stringify(expected.event));
  expect(payload).toEqual(expectedPayload);
}
