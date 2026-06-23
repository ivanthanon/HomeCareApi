import { Clock } from "src/modules/employees/domain/shared/clock";

export class DateClock implements Clock {
    now(): Date {
        return new Date();
    }
}
