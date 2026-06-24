import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { Failure } from 'src/modules/employees/domain/shared/result';
import { Clock } from 'src/modules/employees/domain/shared/clock';
import { Employee } from 'src/modules/employees/domain/employee';
import { mock, MockProxy } from 'vitest-mock-extended';

describe('CreateEmployeeCommandHandler', () => {
  let handler: CreateEmployeeCommandHandler;
  let mockRepository: MockProxy<EmployeeRepository>;
  let mockClock: MockProxy<Clock>;

  beforeEach(() => {
    mockRepository = mock<EmployeeRepository>();
    mockClock = mock<Clock>();
    handler = new CreateEmployeeCommandHandler(mockRepository, mockClock);
  });

  it('should call repository.create', async () => {
    const command = new CreateEmployeeCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      'John',
      'Doe',
      '12345678K',
      '1991-06-13T00:00:00.000Z',
    );
    mockClock.now.mockReturnValue(new Date('2026-06-13T00:00:00.000Z'));

    await handler.execute(command);

    const expectedEmployee = Employee.reconstitute(
      command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth
    )
    expect(mockRepository.create).toHaveBeenCalledWith(expectedEmployee);
  });

  it('should throw an error if given employee is not an adult', async () => {
    const command = new CreateEmployeeCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      'John',
      'Doe',
      '12345678K',
      '2008-06-14T00:00:00Z',
    );
    mockClock.now.mockReturnValue(new Date('2026-06-13T00:00:00.000Z'));

    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    const failure: Failure<Error> = result as Failure<Error>;
    expect(failure.error.message).toBe('Employee must be an adult');
  });
})
