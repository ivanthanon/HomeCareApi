import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";
import { isAValidGuid } from "../shared/utils";
export class EmployeeId {
    public constructor(readonly value: string) {}

    public static create(value: string): Result<EmployeeId, Error> {
        if (isAValidGuid(value) == false) {
            return Err(new Error('Invalid UUID format'));
        }
        
        return Ok(new EmployeeId(value));
    }
}