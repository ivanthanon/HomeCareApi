import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { Failure } from 'src/modules/employees/domain/shared/result';
import { Clock } from 'src/modules/employees/domain/shared/clock';
import { Employee } from 'src/modules/employees/domain/employee';
import { mock, MockProxy } from 'vitest-mock-extended';
import { ConfigService } from '@nestjs/config';

describe('CreateEmployeeCommandHandler', () => {
  let handler: CreateEmployeeCommandHandler;
  let mockRepository: MockProxy<EmployeeRepository>;
  let mockClock: MockProxy<Clock>;

  beforeEach(() => {
    mockRepository = mock<EmployeeRepository>();
    mockClock = mock<Clock>();
    handler = new CreateEmployeeCommandHandler(mockRepository, mockClock, new ConfigService({app: {ageOfMajority: 18}}));
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
    expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining(expectedEmployee));
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

  it('should not call to save when employee already exists and return success', async () => {
    const command = new CreateEmployeeCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      'John',
      'Doe',
      '12345678K',
      '1991-06-14',
    );
    mockRepository.getBy.mockResolvedValue(
      Employee.reconstitute(command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth)
    );

    const result = await handler.execute(command);

    expect(result.success).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledTimes(0);
  })

  it('should throw an exception when configuration of age majority does not exist', async () => {
    const command = new CreateEmployeeCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      'John',
      'Doe',
      '12345678K',
      '2008-06-14T00:00:00Z',
    );
    const handlerWithoutConfigAgeMajority = new CreateEmployeeCommandHandler(mockRepository, mockClock, new ConfigService());


    await expect(handlerWithoutConfigAgeMajority.execute(command)).rejects.toThrow(
    "The value of AgeOfMajority doesn't exist in configuration"
    );
  })
})
