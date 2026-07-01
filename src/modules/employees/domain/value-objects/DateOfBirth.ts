import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";

export class DateOfBirth {
    public constructor(readonly value: Date) { }

    public static create(value: Date, currentDate: Date, ageOfMajority: number): Result<DateOfBirth, Error> {
        if (isNaN(value.getTime())) {
            return Err(new Error("The date of birth is not a valid Date"))
        }

        if (!this.IsAdult(currentDate, value, ageOfMajority)) {
            return Err(new Error("Employee must be an adult"));
        }
        
        return Ok(new DateOfBirth(value));
    }

    private static IsAdult(currentDate: Date, dateOfBirth: Date, ageOfMajority: number): boolean {
        const yearDiff = currentDate.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = currentDate.getMonth() - dateOfBirth.getMonth();
        const dayDiff = currentDate.getDate() - dateOfBirth.getDate();

        if (yearDiff > ageOfMajority || (yearDiff === ageOfMajority && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))) {
            return true;
        }

        return false;
    }
}


