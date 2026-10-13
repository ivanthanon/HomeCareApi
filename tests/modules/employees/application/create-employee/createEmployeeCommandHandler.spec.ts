import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CreateEmployeeCommand, CreateEmployeeCommandHandler } from "src/modules/employees/application/create-employee/createEmployeeCommandHandler"
import { EmployeeAlreadyExistsError } from "src/modules/employees/application/errors/employeeAlreadyExistsError";
import { TransactionScope } from "src/modules/employees/application/ports/transactionScope";
import { EmployeeInMemoryRepository } from "../../../../doubles/fake/EmployeeInMemoryRepository";
import { OutboxInMemoryRepository } from "../../../../doubles/fake/OutboxInMemoryRepository";
import { DateClockStub } from "../../../../doubles/stub/dateClockStub";
import { assertOutboxEventInMemory } from "../../../../helpers/assert/OutboxTestHelper";
import { Clock } from "src/modules/employees/domain/shared/clock";
import { Employee } from "src/modules/employees/domain/employee";
import { EmployeeCreatedV1 } from "src/modules/employees/domain/events/EmployeeCreatedV1";
import { Failure } from "src/modules/employees/domain/shared/result";
import { ForRetrievingMajorityAge } from 'src/modules/employees/application/ports/forRetrievingMajorityAge';

describe('CreateEmployeeCommandHandler', () => {
    let handler: CreateEmployeeCommandHandler;
    let inMemoryRepository: EmployeeInMemoryRepository;
    let outboxInMemoryRepository: OutboxInMemoryRepository;
    let transactionScope: TransactionScope & { execute: ReturnType<typeof vi.fn> };
    let mockClock: Clock;
    let configurationProvider: ForRetrievingMajorityAge;

    beforeEach(() => {
        inMemoryRepository = new EmployeeInMemoryRepository();
        outboxInMemoryRepository = new OutboxInMemoryRepository();
        transactionScope = {
            execute: vi.fn(async (work) => work()),
        };
        mockClock = new DateClockStub();
        configurationProvider = { getAgeOfMajority: () => 18 };
        handler = new CreateEmployeeCommandHandler(
            inMemoryRepository,
            outboxInMemoryRepository,
            transactionScope,
            mockClock,
            configurationProvider,
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

    it('should return a failure if given employee is not an adult', async () => {
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
            inMemoryRepository, outboxInMemoryRepository, transactionScope, mockClock,
            { getAgeOfMajority: () => undefined },
        );

        await expect(handlerWithoutConfig.execute(validCommand())).rejects.toThrow(
            "The value of AgeOfMajority doesn't exist in configuration"
        );
    });

    it('should execute within a transactionScope when creating an employee successfully', async () => {
        await handler.execute(validCommand());

        expect(transactionScope.execute).toHaveBeenCalledOnce();
    });

    it('should return a duplicate employee failure when employee already exists', async () => {
        inMemoryRepository.employeeList.push(Employee.reconstitute(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
        ));

        const result = await handler.execute(validCommand());

        expect(result).toEqual({
            success: false,
            error: expect.any(EmployeeAlreadyExistsError),
        });
        expect((result as Failure<Error>).error.message).toBe('Employee already exists');
        expect(inMemoryRepository.employeeList).toHaveLength(1);
        expect(outboxInMemoryRepository.events).toHaveLength(0);
    });

    it('should return a duplicate employee failure when document number already exists', async () => {
        inMemoryRepository.employeeList.push(Employee.reconstitute(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
        ));
        const commandWithExistingDocumentNumber = new CreateEmployeeCommand(
            '650e8400-e29b-41d4-a716-446655440000',
            'Jane',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
        );

        const result = await handler.execute(commandWithExistingDocumentNumber);

        expect(result).toEqual({
            success: false,
            error: expect.any(EmployeeAlreadyExistsError),
        });
        expect((result as Failure<Error>).error.message).toBe('Employee already exists');
        expect(inMemoryRepository.employeeList).toHaveLength(1);
        expect(outboxInMemoryRepository.events).toHaveLength(0);
    });
});
