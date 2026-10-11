import { Employee } from "src/modules/employees/domain/employee";
import { Success, Failure } from "src/modules/employees/domain/shared/result";

describe("When creating an employee", () =>  {
    it("should be add a domain event EmployeeCreated.v1", () => {
        const employee = Employee.create(
            "550e8400-e29b-41d4-a716-446655440000",
            "Juan",
            "Perez",
            "12345678K",
            new Date("1991-06-13"),
            new Date("2026-06-13"),
            18
        );

        const employeeSuccess = employee as Success<Employee>;
        expect(employeeSuccess.value.DomainEvents.length).toBe(1);
        expect(employeeSuccess.value.DomainEvents[0].eventName).toBe("EmployeeCreated.v1");
    });
});

describe("When pull events from employee", () =>  {
    it("should be return the domain events and clear the list", () => {
        const employee = Employee.create(
            "550e8400-e29b-41d4-a716-446655440000",
            "Juan",
            "Perez",
            "12345678K",
            new Date("1991-06-13"),
            new Date("2026-06-13"),
            18
        );

        const employeeSuccess = employee as Success<Employee>;
        const domainEvents = employeeSuccess.value.pullDomainEvents();
        expect(domainEvents.length).toBe(1);
        expect(domainEvents[0].eventName).toBe("EmployeeCreated.v1");
        expect(employeeSuccess.value.DomainEvents.length).toBe(0);
    });
});

describe("When deleting an employee", () => {
    const anEmployee = () => Employee.reconstitute(
        "550e8400-e29b-41d4-a716-446655440000",
        "Juan",
        "Perez",
        "12345678K",
        new Date("1991-06-13T00:00:00.000Z"),
    );

    it("should mark the employee as deleted and add a EmployeeDeleted.v1 domain event", () => {
        const employee = anEmployee();
        const deletedAt = new Date("2026-01-01T00:00:00.000Z");

        const result = employee.delete(deletedAt);

        expect(result.success).toBe(true);
        expect(employee.deletedAt).toEqual(deletedAt);
        expect(employee.DomainEvents.length).toBe(1);
        expect(employee.DomainEvents[0].eventName).toBe("EmployeeDeleted.v1");
    });

    it("should fail when the employee is already deleted", () => {
        const employee = Employee.reconstitute(
            "550e8400-e29b-41d4-a716-446655440000",
            "Juan",
            "Perez",
            "12345678K",
            new Date("1991-06-13T00:00:00.000Z"),
            new Date("2025-12-31T00:00:00.000Z"),
        );

        const result = employee.delete(new Date("2026-01-01T00:00:00.000Z"));

        expect(result.success).toBe(false);
        const failure = result as Failure<Error>;
        expect(failure.error.message).toBe("Employee is already deleted");
        expect(employee.deletedAt).toEqual(new Date("2025-12-31T00:00:00.000Z"));
        expect(employee.DomainEvents.length).toBe(0);
    });
});

describe("When reconstituting an employee", () => {
    it("should rebuild every field from persisted data", () => {
        const id = "550e8400-e29b-41d4-a716-446655440000";
        const firstName = "Juan";
        const lastName = "Perez";
        const documentNumber = "12345678K";
        const dateOfBirth = new Date("1991-06-13T00:00:00.000Z");
        const deletedAt = new Date("2025-12-31T00:00:00.000Z");

        const employee = Employee.reconstitute(
            id,
            firstName,
            lastName,
            documentNumber,
            dateOfBirth,
            deletedAt,
        );

        expect(employee.id.value).toBe(id);
        expect(employee.firstName.value).toBe(firstName);
        expect(employee.lastName.value).toBe(lastName);
        expect(employee.documentNumber.value).toBe(documentNumber);
        expect(employee.dateOfBirth.value).toEqual(dateOfBirth);
        expect(employee.deletedAt).toEqual(deletedAt);
    });

    it("should rebuild an active employee with deletedAt defaulting to null", () => {
        const employee = Employee.reconstitute(
            "550e8400-e29b-41d4-a716-446655440000",
            "Juan",
            "Perez",
            "12345678K",
            new Date("1991-06-13T00:00:00.000Z"),
        );

        expect(employee.deletedAt).toBeNull();
    });

    it("should not raise any domain event", () => {
        const employee = Employee.reconstitute(
            "550e8400-e29b-41d4-a716-446655440000",
            "Juan",
            "Perez",
            "12345678K",
            new Date("1991-06-13T00:00:00.000Z"),
        );

        expect(employee.DomainEvents.length).toBe(0);
    });
});
