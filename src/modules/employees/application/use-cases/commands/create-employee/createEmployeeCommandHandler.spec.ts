import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/use-cases/commands/create-employee/createEmployeeCommandHandler';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { Employee } from 'src/modules/employees/domain/entities/employee';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Failure } from 'src/modules/employees/domain/shared/result';

describe('CreateEmployeeCommandHandler', () => {
  let handler: CreateEmployeeCommandHandler;
  let mockRepository: EmployeeRepository;

  beforeEach(() => {
    mockRepository = { create: vi.fn() };
    handler = new CreateEmployeeCommandHandler(mockRepository);
  });

  it('should call repository.create and return the id', async () => {
    const command = new CreateEmployeeCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      'John',
      'Doe',
      '12345678',
      '1990-01-01',
    );

    await handler.execute(command);

    const expectedEmployee = new Employee(command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth);
    expect(mockRepository.create).toHaveBeenCalledWith(expectedEmployee);
  });

  it('should throw an error if given employee is not an adult', async () => {
    const command = new CreateEmployeeCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      'John',
      'Doe',
      '12345678',
      '2026-01-01',
    );

    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    const failure : Failure<Error> = result as Failure<Error>;
    expect(failure.error.message).toBe('Employee must be an adult');
  });
})
