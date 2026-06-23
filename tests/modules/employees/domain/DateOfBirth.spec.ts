import { Failure } from "src/modules/employees/domain/shared/result";
import { DateOfBirth } from "src/modules/employees/domain/value-objects/DateOfBirth";

describe('DateOfBirth VO', () => {
    it.each([
        '2008-06-15',
        '2008-07-13',
        '2009-05-12'])
        ('should not create a DateOfBirth when is not an adult', (dateOfBirth) => {
        const currentDate = new Date('2026-06-14');
        const result = DateOfBirth.create(dateOfBirth, currentDate);
        expect(result.success).toBe(false);
        const resultAsError = result as Failure<Error>;
        expect(resultAsError.error.message).toBe("Employee must be an adult");
    });

    it.each([
        '2008-06-14',
        '2008-06-13',
        '2008-05-12',
        '2007-05-05'])
        ('should create a DateOfBirth when is an adult', (dateOfBirth) => {
        const currentDate = new Date('2026-06-14');
        const result = DateOfBirth.create(dateOfBirth, currentDate);
        expect(result.success).toBe(true);
    });
});

describe('When DateOfBirth is a invalid date', () => {
    it('should not createe a DateBirth', () => {
        const invalidDate = "InvalidDate";
        const currentDate = new Date('2025-06-14');
        const result = DateOfBirth.create(invalidDate, currentDate);

        expect(result.success).toBe(false);
        const resultAsError = result as Failure<Error>;
        expect(resultAsError.error.message).toBe("The date of birth is not a valid Date");
    });
});