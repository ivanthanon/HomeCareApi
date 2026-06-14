import { Clock } from "src/modules/employees/domain/shared/clock";

export class DateClock implements Clock {
    now(): Date {
        return new Date();
    }
}

export class DateClockStub implements Clock {
    now(): Date {
        return new Date('2026-01-01T00:00:00.000Z');
    }
}
