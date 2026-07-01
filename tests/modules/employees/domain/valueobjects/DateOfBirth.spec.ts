import { Failure } from "src/modules/employees/domain/shared/result";
import { DateOfBirth } from "src/modules/employees/domain/value-objects/DateOfBirth";

describe('DateOfBirth VO', () => {
    it.each([
        new Date('2008-06-15T00:00:00Z'),
        new Date('2008-07-13T00:00:00Z'),
        new Date('2009-05-12T00:00:00Z')])
        ('should not create a DateOfBirth when is not an adult', (dateOfBirth) => {
        const currentDate = new Date('2026-06-14');
        const result = DateOfBirth.create(dateOfBirth, currentDate, 18);
        expect(result.success).toBe(false);
        const resultAsError = result as Failure<Error>;
        expect(resultAsError.error.message).toBe("Employee must be an adult");
    });

    it.each([
        new Date('2020-06-14T00:00:00Z'),
        new Date('2020-06-13T00:00:00Z'),
        new Date('2020-05-12T00:00:00Z'),
        new Date('2020-05-05T00:00:00Z')])
        ('should create a DateOfBirth when is an adult', (dateOfBirth) => {
        const currentDate = new Date('2026-06-14');
        const result = DateOfBirth.create(dateOfBirth, currentDate, 6);
        expect(result.success).toBe(true);
    });
});

describe('When DateOfBirth is a invalid date', () => {
    it('should not createe a DateBirth', () => {
        const invalidDate = new Date("InvalidDate");
        const currentDate = new Date('2025-06-14T00:00:00Z');
        const result = DateOfBirth.create(invalidDate, currentDate, 18);

        expect(result.success).toBe(false);
        const resultAsError = result as Failure<Error>;
        expect(resultAsError.error.message).toBe("The date of birth is not a valid Date");
    });
});