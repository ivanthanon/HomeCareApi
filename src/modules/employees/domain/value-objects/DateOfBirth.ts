import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";
import { isAValidDate } from "../shared/utils";

export class DateOfBirth {
    public constructor(readonly value: Date) { }

    public static create(value: string, currentDate: Date): Result<DateOfBirth, Error> {
        if (!isAValidDate(value)) {
            return Err(new Error("The date of birth is not a valid Date"))
        }

        if (!this.IsAdult(currentDate, value)) {
            return Err(new Error("Employee must be an adult"));
        }
        
        return Ok(new DateOfBirth(new Date(value)));
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


