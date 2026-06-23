import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";
export class EmployeeId {
    public constructor(readonly value: string) {}

    public static create(value: string): Result<EmployeeId, Error> {
        if (this.IsAValidGuid(value) == false) {
            return Err(new Error('Invalid UUID format'));
        }
        
        return Ok(new EmployeeId(value));
    }

    private static IsAValidGuid(value: string): boolean {
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        return uuidRegex.test(value);
    }
}