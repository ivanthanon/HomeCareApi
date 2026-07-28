import { CreateEmployeeCommand, CreateEmployeeCommandHandler } from "src/modules/employees/application/create-employee/createEmployeeCommandHandler"
import { DateClockStub } from "../../infrastructure/helpers/stub/dateClockStub";
import { EmployeeInMemoryRepository } from "../../infrastructure/helpers/fake/EmployeeInMemoryRepository";
import { OutboxInMemoryRepository as OutboxInMemoryRepository } from "../../infrastructure/helpers/fake/OutboxFakeRepository";
import { assertOutboxEventInMemory } from "../../infrastructure/helpers/assert/OutboxTestHelper";
import { Clock } from "src/modules/employees/domain/shared/clock";
import { Employee } from "src/modules/employees/domain/employee";
import { EmployeeCreatedV1 } from "src/modules/employees/domain/events/EmployeeCreatedV1";
import { Failure } from "src/modules/employees/domain/shared/result";
import { ConfigService } from "@nestjs/config";
import { UnitOfWork } from "src/modules/employees/domain/shared/unitofwork";
import { mock, MockProxy } from "vitest-mock-extended";
import { vi } from "vitest";


describe('CreateEmployeeCommandHandler', () => {
    let handler: CreateEmployeeCommandHandler;
    let inMemoryRepository: EmployeeInMemoryRepository;
    let outboxInMemoryRepository: OutboxInMemoryRepository;
    let mockUnitOfWork: MockProxy<UnitOfWork>;
    let mockClock: Clock;

    beforeEach(() => {
        inMemoryRepository = new EmployeeInMemoryRepository();
        outboxInMemoryRepository = new OutboxInMemoryRepository();
        mockUnitOfWork = mock<UnitOfWork>();
        mockClock = new DateClockStub();
    })

    const createHandler = (config?: Record<string, unknown>) => {
        return new CreateEmployeeCommandHandler(
            inMemoryRepository,
            outboxInMemoryRepository,
            mockUnitOfWork,
            mockClock,
            new ConfigService(config ?? { app: { ageOfMajority: 18 } }),
        );
    };

    it('should create employee in memory repository', async () => {
        mockUnitOfWork.transaction.mockImplementation(async (work) => work());
        handler = createHandler();

        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
        );

        await handler.execute(command);

        const expectedEmployee = Employee.reconstitute(
            command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth
        )
        expect(inMemoryRepository.employeeList.length).toBe(1);
        expect(inMemoryRepository.employeeList[0]).toEqual(expectedEmployee);
    });

    it('should persist EmployeeCreated.v1 domain event in outbox', async () => {
        mockUnitOfWork.transaction.mockImplementation(async (work) => work());
        handler = createHandler();

        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
        );

        await handler.execute(command);

        assertOutboxEventInMemory(outboxInMemoryRepository.events, new EmployeeCreatedV1(
            command.id,
            command.firstName,
            command.lastName,
            command.documentNumber,
            command.dateOfBirth,
            new Date('2026-01-01T00:00:00.000Z'),
        ));
    });

    it('should throw an error if given employee is not an adult', async () => {
        mockUnitOfWork.transaction.mockImplementation(async (work) => work());
        handler = createHandler();

        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('2008-06-14T00:00:00Z'),
        );

        const result = await handler.execute(command);

        expect(result.success).toBe(false);
        const failure: Failure<Error> = result as Failure<Error>;
        expect(failure.error.message).toBe('Employee must be an adult');
        expect(inMemoryRepository.employeeList.length).toBe(0);
    });

    it('should throw an exception when configuration of age majority does not exist', async () => {
        mockUnitOfWork.transaction.mockImplementation(async (work) => work());
        handler = createHandler();

        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('2008-06-14T00:00:00Z'),
        );
        const handlerWithoutConfigAgeMajority = new CreateEmployeeCommandHandler(inMemoryRepository, outboxInMemoryRepository, mockUnitOfWork, mockClock, new ConfigService());

        await expect(handlerWithoutConfigAgeMajority.execute(command)).rejects.toThrow(
            "The value of AgeOfMajority doesn't exist in configuration"
        );
    });

    it('should open and commit transaction when creating an employee', async () => {
        mockUnitOfWork.transaction.mockImplementation(async (work) => {
            await work();
        });
        handler = createHandler();

        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
        );

        await handler.execute(command);

        expect(mockUnitOfWork.transaction).toHaveBeenCalledTimes(1);
        expect(inMemoryRepository.employeeList.length).toBe(1);
        expect(outboxInMemoryRepository.events.length).toBe(1);
    });

    it('should open and rollback transaction when repository fails', async () => {
        const dbError = new Error('DB connection lost');
        mockUnitOfWork.transaction.mockImplementation(async (work) => {
            try {
                await work();
            } catch (error) {
                throw error;
            }
        });
        handler = createHandler();

        const saveSpy = vi.spyOn(outboxInMemoryRepository, 'save').mockRejectedValueOnce(dbError);

        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
        );

        await expect(handler.execute(command)).rejects.toThrow('DB connection lost');

        expect(mockUnitOfWork.transaction).toHaveBeenCalledTimes(1);
        expect(inMemoryRepository.employeeList.length).toBe(0);
        expect(outboxInMemoryRepository.events.length).toBe(0);
        saveSpy.mockRestore();
    });

    it('should not open transaction when employee already exists', async () => {
        mockUnitOfWork.transaction.mockImplementation(async (work) => work());
        handler = createHandler();

        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-14'),
        );
        inMemoryRepository.employeeList.push(
            Employee.reconstitute(command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth)
        );

        await handler.execute(command);

        expect(mockUnitOfWork.transaction).toHaveBeenCalledTimes(0);
    });
})
