import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/use-cases/commands/create-employee/createEmployeeCommandHandler';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { Employee } from 'src/modules/employees/domain/employee';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Failure } from 'src/modules/employees/domain/shared/result';
import { Clock } from 'src/modules/employees/domain/shared/clock';

describe('CreateEmployeeCommandHandler', () => {
  let handler: CreateEmployeeCommandHandler;
  let mockRepository: EmployeeRepository;
  let mockClock: Clock;

  beforeEach(() => {
    mockRepository = { create: vi.fn() };
    mockClock = { now: vi.fn().mockReturnValue(new Date('2026-06-13T00:00:00.000Z')) };
    handler = new CreateEmployeeCommandHandler(mockRepository, mockClock);
  });

  it('should call repository.create', async () => {
    const employeeJson = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'John',
      lastName: 'Doe',
      documentNumber: '12345789K',
      dateOfBirth: '1991-06-13',
    };

    const command = new CreateEmployeeCommand(
      employeeJson.id,
      employeeJson.firstName,
      employeeJson.lastName,
      employeeJson.documentNumber,
      employeeJson.dateOfBirth,
    );

    await handler.execute(command);

    expect(mockRepository.create).toHaveBeenCalledWith(expect.any(Employee));
    const passedEmployee = vi.mocked(mockRepository.create).mock.calls[0][0] as Employee;  
    expect(passedEmployee.id.value).toBe(employeeJson.id);
    expect(passedEmployee.firstName.value).toBe(employeeJson.firstName);
    expect(passedEmployee.lastName.value).toBe(employeeJson.lastName);
    expect(passedEmployee.documentNumber.value).toBe(employeeJson.documentNumber);
    expect(passedEmployee.dateOfBirth.value).toBe(employeeJson.dateOfBirth);
  });

  it('should throw an error if given employee is not an adult', async () => {
    const employeeJson = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      firstName: 'John',
      lastName: 'Doe',
      documentNumber: '12345678K',
      dateOfBirth: '2008-06-14',
    };

    const command = new CreateEmployeeCommand(
      employeeJson.id,
      employeeJson.firstName,
      employeeJson.lastName,
      employeeJson.documentNumber,
      employeeJson.dateOfBirth,
    );

    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    const failure : Failure<Error> = result as Failure<Error>;
    expect(failure.error.message).toBe('Employee must be an adult');
  });
})
