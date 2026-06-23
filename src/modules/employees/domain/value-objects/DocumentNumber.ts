import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";

export class DocumentNumber {
    public constructor (readonly value: string) {}

    public static create(value: string): Result<DocumentNumber, Error> {
        if (value.length !== 9) {
            return Err(new Error("Invalid document number format. It must be exactly 9 characters long."));
        }

        if (IsTheLastCharacterACapitalLetter(value) == false) {
            return Err(new Error("Invalid document number format. The last character must be a capital letter."));
        }

        return Ok(new DocumentNumber(value));
    }
}

function IsTheLastCharacterACapitalLetter(value: string) {
    return /[A-Z]/.test(value.charAt(8));
}
