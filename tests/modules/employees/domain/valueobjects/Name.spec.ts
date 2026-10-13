import { Name } from "src/modules/employees/domain/value-objects/Name";

describe("Name Value Object", () =>  {
    it("should not create a Name when value is less than two characters", () => {
        const invalidName = "X";
        const name = Name.create(invalidName);
        expect(name.success).toBe(false);
        expect(name).toHaveProperty("error.message", "Name must be at least 2 characters long");
    });

    it("should create a Name when value is valid", () => {
        const validName = "Juan";
        const name = Name.create(validName);
        expect(name.success).toBe(true);
        expect(name).toHaveProperty("value.value", validName);
    });
});