import { Ok, Err, Result } from "src/modules/employees/domain/shared/result";

export class Name {
    private constructor (readonly value: string) {}

    public static create(value: string): Result<Name, Error> {
        if (value.length < 2) {
            return Err(new Error('Name must be at least 2 characters long'));
        }

        return Ok(new Name(value));
    }
}