import { CreateEmployeeCommand, CreateEmployeeCommandHandler } from "src/modules/employees/application/create-employee/createEmployeeCommandHandler"
import { DateClockStub } from "../../infrastructure/stubs/dateClockStub";
import { EmployeeInMemoryRepository } from "../../infrastructure/contract/EmployeeInMemoryRepository";
import { OutboxFakeRepository as OutboxInMemoryRepository } from "../../infrastructure/contract/OutboxFakeRepository";
import { EmployeeCreatedV1 } from "src/modules/employees/domain/events/EmployeeCreatedV1";
import { Clock } from "src/modules/employees/domain/shared/clock";
import { Employee } from "src/modules/employees/domain/employee";
import { Failure } from "src/modules/employees/domain/shared/result";
import { ConfigService } from "@nestjs/config";


describe('CreateEmployeeCommandHandler', () => {
    let handler: CreateEmployeeCommandHandler;
    let inMemoryRepository: EmployeeInMemoryRepository;
    let outboxInMemoryRepository: OutboxInMemoryRepository;
    let mockClock: Clock;

    beforeEach(() => {
        inMemoryRepository = new EmployeeInMemoryRepository();
        outboxInMemoryRepository = new OutboxInMemoryRepository();
        mockClock = new DateClockStub();
        handler = new CreateEmployeeCommandHandler(inMemoryRepository, outboxInMemoryRepository, mockClock, new ConfigService({app: {ageOfMajority: 18}}));
    })

    it('should create employee in memory repository', async () => {
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
        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('1991-06-13T00:00:00.000Z'),
        );

        await handler.execute(command);

        expect(outboxInMemoryRepository.events).toHaveLength(1);
        const event = outboxInMemoryRepository.events[0] as EmployeeCreatedV1;
        expect(event.eventName).toBe('EmployeeCreated.v1');
        expect(event.id).toBe(command.id);
        expect(event.firstName).toBe(command.firstName);
        expect(event.lastName).toBe(command.lastName);
        expect(event.documentNumber).toBe(command.documentNumber);
        expect(event.dateOfBirth).toEqual(command.dateOfBirth);
        expect(event.occurredOn).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    });

    it('should throw an error if given employee is not an adult', async () => {
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
        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            new Date('2008-06-14T00:00:00Z'),
        );
        const handlerWithoutConfigAgeMajority = new CreateEmployeeCommandHandler(inMemoryRepository, outboxInMemoryRepository, mockClock, new ConfigService());


        await expect(handlerWithoutConfigAgeMajority.execute(command)).rejects.toThrow(
            "The value of AgeOfMajority doesn't exist in configuration"
        );
    })
})