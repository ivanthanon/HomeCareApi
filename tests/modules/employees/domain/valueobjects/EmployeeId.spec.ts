import { EmployeeId } from "src/modules/employees/domain/value-objects/EmployeeId";

describe("EmployeeId Value Object", () => {
    it("should not create an EmployeeId when UUID is invalid", () => {
        const invalidUUID = "this-is-not-a-guid";
        const employeeId = EmployeeId.create(invalidUUID);
        if (employeeId.success == false) {
            expect(employeeId.error.message).toBe("Invalid UUID format");
        }
    });
    it("should create an EmployeeId when UUID is valid", () => {
        const validUUID = "550e8400-e29b-41d4-a716-446655440000";
        const employeeId = EmployeeId.create(validUUID);
        if (employeeId.success) {
            expect(employeeId.value.value).toBe(validUUID);
        }
    })
});

