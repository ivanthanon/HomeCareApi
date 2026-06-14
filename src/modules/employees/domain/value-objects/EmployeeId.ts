import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";
export class EmployeeId {
    private constructor(readonly value: string) {}

    public static create(value: string): Result<EmployeeId, Error> {
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (uuidRegex.test(value) == false) {
            return Err(new Error());
        }
        
        return Ok(new EmployeeId(value));
    }
}