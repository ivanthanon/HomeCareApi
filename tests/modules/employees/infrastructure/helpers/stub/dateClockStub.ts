import { Clock } from "src/modules/employees/domain/shared/clock";

export class DateClockStub implements Clock {
    now(): Date {
        return new Date('2026-01-01T00:00:00.000Z');
    }
}