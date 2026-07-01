import { Name } from "src/modules/employees/domain/value-objects/Name";

describe("Name Value Object", () =>  {
    it("should not create a Name when value is less than two characters", () => {
        const invalidName = "X";
        const name = Name.create(invalidName);
        if (name.success == false) {
            expect(name.error.message).toBe("Name must be at least 2 characters long");
        }
    });

    it("should create a Name when value is valid", () => {
        const validName = "Juan";
        const name = Name.create(validName);
        if (name.success == true) {
            expect(name.value.value).toBe(validName);
        }
    });
});