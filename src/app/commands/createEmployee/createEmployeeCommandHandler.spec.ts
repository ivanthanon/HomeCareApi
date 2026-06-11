import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from './createEmployeeCommandHandler';
import { EmployeeRepository } from '../../ports/driven/employee.repository';
import { Employee } from '../../ports/driven/employee.repository';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
});


