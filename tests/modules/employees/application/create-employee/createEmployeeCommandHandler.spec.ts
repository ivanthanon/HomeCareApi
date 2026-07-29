import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CreateEmployeeCommand, CreateEmployeeCommandHandler } from "src/modules/employees/application/create-employee/createEmployeeCommandHandler"
import { SqlServerTransactionScope } from "src/modules/employees/infrastructure/adapters/sqlServerTransactionScope";
import { EmployeeInMemoryRepository } from "../../../../doubles/fake/EmployeeInMemoryRepository";
import { OutboxInMemoryRepository } from "../../../../doubles/fake/OutboxInMemoryRepository";
import { DateClockStub } from "../../../../doubles/stub/dateClockStub";
import { assertOutboxEventInMemory } from "../../../../helpers/assert/OutboxTestHelper";
import { Clock } from "src/modules/employees/domain/shared/clock";
import { Employee } from "src/modules/employees/domain/employee";
import { EmployeeCreatedV1 } from "src/modules/employees/domain/events/EmployeeCreatedV1";
import { Failure } from "src/modules/employees/domain/shared/result";
import { ConfigService } from "@nestjs/config";

const { mockBegin, mockCommit, mockRollback } = vi.hoisted(() => ({
  mockBegin: vi.fn().mockResolvedValue(undefined),
  mockCommit: vi.fn().mockResolvedValue(undefined),
  mockRollback: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('mssql', () => {
  class MockTransaction {
    begin = mockBegin;
    commit = mockCommit;
    rollback = mockRollback;
    request = vi.fn().mockReturnValue({
      input: vi.fn().mockReturnThis(),
      query: vi.fn().mockResolvedValue({ recordset: [] }),
    });
  }
  return {
    ConnectionPool: vi.fn(),
    Transaction: MockTransaction,
    UniqueIdentifier: 'UniqueIdentifier',
    NVarChar: 'NVarChar',
    Date: 'Date',
  };
});

describe('CreateEmployeeCommandHandler', () => {
    let handler: CreateEmployeeCommandHandler;
    let inMemoryRepository: EmployeeInMemoryRepository;
    let outboxInMemoryRepository: OutboxInMemoryRepository;
    let unitOfWork: SqlServerTransactionScope;
    let mockClock: Clock;

    beforeEach(() => {
        mockBegin.mockClear();
        mockCommit.mockClear();
        mockRollback.mockClear();
        inMemoryRepository = new EmployeeInMemoryRepository();
        outboxInMemoryRepository = new OutboxInMemoryRepository();
        unitOfWork = new SqlServerTransactionScope(null as any);
        mockClock = new DateClockStub();
        handler = new CreateEmployeeCommandHandler(
            inMemoryRepository,
            outboxInMemoryRepository,
            unitOfWork,
            mockClock,
            new ConfigService({ app: { ageOfMajority: 18 } }),
        );
    });

    const validCommand = () => new CreateEmployeeCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'John',
        'Doe',
        '12345678K',
        new Date('1991-06-13T00:00:00.000Z'),
    );

    it('should create employee in memory repository', async () => {
        await handler.execute(validCommand());

        const expectedEmployee = Employee.reconstitute(
            '550e8400-e29b-41d4-a716-446655440000', 'John', 'Doe', '12345678K', new Date('1991-06-13T00:00:00.000Z')
        );
        expect(inMemoryRepository.employeeList.length).toBe(1);
        expect(inMemoryRepository.employeeList[0]).toEqual(expectedEmployee);
    });

    it('should persist EmployeeCreated.v1 domain event in outbox', async () => {
        await handler.execute(validCommand());

        assertOutboxEventInMemory(outboxInMemoryRepository.events, new EmployeeCreatedV1(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
            new Date('2026-01-01T00:00:00.000Z'),
        ));
    });

    it('should throw an error if given employee is not an adult', async () => {
        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John', 'Doe', '12345678K',
            new Date('2008-06-14T00:00:00Z'),
        );

        const result = await handler.execute(command);

        expect(result.success).toBe(false);
        const failure: Failure<Error> = result as Failure<Error>;
        expect(failure.error.message).toBe('Employee must be an adult');
        expect(inMemoryRepository.employeeList.length).toBe(0);
        expect(outboxInMemoryRepository.events.length).toBe(0);
    });

    it('should throw an exception when configuration of age majority does not exist', async () => {
        const handlerWithoutConfig = new CreateEmployeeCommandHandler(
            inMemoryRepository, outboxInMemoryRepository, unitOfWork, mockClock, new ConfigService(),
        );

        await expect(handlerWithoutConfig.execute(validCommand())).rejects.toThrow(
            "The value of AgeOfMajority doesn't exist in configuration"
        );
    });

    it('should commit transaction when creating an employee successfully', async () => {
        await handler.execute(validCommand());

        expect(mockBegin).toHaveBeenCalledOnce();
        expect(mockCommit).toHaveBeenCalledOnce();
        expect(mockRollback).not.toHaveBeenCalled();
    });

    it('should rollback transaction when repository fails', async () => {
        const dbError = new Error('DB connection lost');
        vi.spyOn(outboxInMemoryRepository, 'save').mockRejectedValueOnce(dbError);

        await expect(handler.execute(validCommand())).rejects.toThrow('DB connection lost');

        expect(mockBegin).toHaveBeenCalledOnce();
        expect(mockRollback).toHaveBeenCalledOnce();
        expect(mockCommit).not.toHaveBeenCalled();
        expect(inMemoryRepository.employeeList.length).toBe(0);
        expect(outboxInMemoryRepository.events.length).toBe(0);
    });

    it('should not open transaction when employee already exists', async () => {
        inMemoryRepository.employeeList.push(
            Employee.reconstitute(
                '550e8400-e29b-41d4-a716-446655440000', 'John', 'Doe', '12345678K', new Date('1991-06-13')
            )
        );

        await handler.execute(validCommand());

        expect(mockBegin).not.toHaveBeenCalled();
        expect(mockCommit).not.toHaveBeenCalled();
        expect(mockRollback).not.toHaveBeenCalled();
    });
});
