import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Failure } from 'src/modules/employees/domain/shared/result';
import { Clock } from 'src/modules/employees/domain/shared/clock';
import { EmployeeFactory } from 'tests/modules/employees/domain/EmployeeFactory';

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
    const command = new CreateEmployeeCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      'John',
      'Doe',
      '12345678K',
      '1991-06-13T00:00:00.000Z',
    );

    await handler.execute(command);

    const expectedEmployee = EmployeeFactory.fromPrimitives(
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
      '2008-06-14',
    );

    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    const failure: Failure<Error> = result as Failure<Error>;
    expect(failure.error.message).toBe('Employee must be an adult');
  });
})
