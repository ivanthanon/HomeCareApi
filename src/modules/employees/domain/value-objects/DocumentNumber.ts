import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";

export class DocumentNumber {
    private constructor (readonly value: string) {}

    public static create(value: string): Result<DocumentNumber, Error> {
        if (value.length !== 9) {
            return Err(new Error("Invalid document number format. It must be exactly 9 characters long."));
        }

        return Ok(new DocumentNumber("value"));
    }
}