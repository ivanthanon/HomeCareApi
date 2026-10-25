import { Employee } from 'src/modules/employees/domain/employee';
import { EmployeeValidationError } from 'src/modules/employees/domain/errors/employeeValidationError';
import { Success } from 'src/modules/employees/domain/shared/result';

describe('When creating an employee', () => {
  it('should be add a domain event EmployeeCreated.v1', () => {
    const employee = Employee.create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'Juan',
      lastName: 'Perez',
      documentNumber: '12345678K',
      dateOfBirth: new Date('1991-06-13'),
      currentDate: new Date('2026-06-13'),
      ageOfMajority: 18,
    });

    const employeeSuccess = employee as Success<Employee>;
    const domainEvents = employeeSuccess.value.pullDomainEvents();
    expect(domainEvents.length).toBe(1);
    expect(domainEvents[0].eventName).toBe('EmployeeCreated.v1');
  });
});

describe('When pull events from employee', () => {
  it('should be return the domain events and clear the list', () => {
    const employee = Employee.create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'Juan',
      lastName: 'Perez',
      documentNumber: '12345678K',
      dateOfBirth: new Date('1991-06-13'),
      currentDate: new Date('2026-06-13'),
      ageOfMajority: 18,
    });

    const employeeSuccess = employee as Success<Employee>;
    const domainEvents = employeeSuccess.value.pullDomainEvents();
    expect(domainEvents.length).toBe(1);
    expect(domainEvents[0].eventName).toBe('EmployeeCreated.v1');
    expect(employeeSuccess.value.pullDomainEvents()).toEqual([]);
  });

  it('should return a typed domain validation error when the id is invalid', () => {
    const result = Employee.create({
      id: 'invalid',
      firstName: 'Juan',
      lastName: 'Perez',
      documentNumber: '12345678K',
      dateOfBirth: new Date('1991-06-13'),
      currentDate: new Date('2026-06-13'),
      ageOfMajority: 18,
    });

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error).toBeInstanceOf(EmployeeValidationError);
      expect(result.error.code).toBe('employee.id.invalid');
      expect(result.error.message).toBe('Invalid UUID format');
    }
  });
});
