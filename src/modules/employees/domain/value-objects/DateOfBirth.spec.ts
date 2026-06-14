import { DateOfBirth } from "./DateOfBirth";

describe('DateOfBirth VO', () => {
    it.each([
        '2008-06-15',
        '2008-07-13',
        '2009-05-12'])
        ('should create a DateOfBirth when is an adult', (dateOfBirth) => {
        const currentDate = new Date('2026-06-14');
        const result = DateOfBirth.create(dateOfBirth, currentDate);
        expect(result.success).toBe(false);
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