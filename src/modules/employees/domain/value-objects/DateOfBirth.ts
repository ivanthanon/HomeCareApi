import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";

export class DateOfBirth {
    private constructor(readonly value: string) { }

    public static create(value: string, currentDate: Date): Result<DateOfBirth, Error> {
        if (!this.IsAdult(currentDate, value)) {
            return Err(new Error("Employee must be an adult"));
        }
        
        return Ok(new DateOfBirth(value));
    }

    private static IsAdult(currentDate: Date, dateOfBirth: string): boolean {
        const yearDiff = currentDate.getFullYear() - new Date(dateOfBirth).getFullYear();
        const monthDiff = currentDate.getMonth() - new Date(dateOfBirth).getMonth();
        const dayDiff = currentDate.getDate() - new Date(dateOfBirth).getDate();

        if (yearDiff > 18 || (yearDiff === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))) {
            return true;
        }

        return false;
    }
}


