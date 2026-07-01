import { Employee } from "src/modules/employees/domain/employee";
import { Success } from "src/modules/employees/domain/shared/result";

describe("When creating an employee", () =>  {
    it("should be add a domain event EmployeeCreated.v1", () => {
        const employee = Employee.create(
            "550e8400-e29b-41d4-a716-446655440000",
            "Juan",
            "Perez",
            "12345678K",
            "1991-06-13",
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
            "1991-06-13",
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
