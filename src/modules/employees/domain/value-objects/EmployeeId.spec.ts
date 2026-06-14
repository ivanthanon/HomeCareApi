import { EmployeeId } from './EmployeeId';

describe("EmployeeId Value Object", () => {
    describe("Create", () => {
        it("should not create an EmployeeId when UUID is invalid", () => {
            const invalidUUID = "this-is-not-a-guid";
            const employeeId = EmployeeId.create(invalidUUID);
            expect(employeeId.success).toBe(false);
        });
    });
})
