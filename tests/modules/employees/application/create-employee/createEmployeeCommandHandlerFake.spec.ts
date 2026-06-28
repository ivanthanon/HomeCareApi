import { CreateEmployeeCommand, CreateEmployeeCommandHandler } from "src/modules/employees/application/create-employee/createEmployeeCommandHandler"
import { DateClockStub } from "../../infrastructure/stubs/dateClockStub";
import { EmployeeInMemoryRepository } from "../../infrastructure/contract/EmployeeInMemoryRepository";
import { Clock } from "src/modules/employees/domain/shared/clock";
import { Employee } from "src/modules/employees/domain/employee";
import { Failure } from "src/modules/employees/domain/shared/result";
import { ConfigService } from "@nestjs/config";


describe('CreateEmployeeCommandHandler', () => {
    let handler: CreateEmployeeCommandHandler;
    let inMemoryRepository: EmployeeInMemoryRepository;
    let mockClock: Clock;

    beforeEach(() => {
        inMemoryRepository = new EmployeeInMemoryRepository();
        mockClock = new DateClockStub();
        handler = new CreateEmployeeCommandHandler(inMemoryRepository, mockClock,  new ConfigService({app: {ageOfMajority: 18}}));
    })

    it('should create employee in memory repository', async () => {
        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            '1991-06-13T00:00:00.000Z',
        );

        await handler.execute(command);

        const expectedEmployee = Employee.reconstitute(
            command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth
        )
        expect(inMemoryRepository.employeeList.length).toBe(1);
        expect(inMemoryRepository.employeeList[0]).toMatchObject(expectedEmployee);
    });

    it('should throw an error if given employee is not an adult', async () => {
        const command = new CreateEmployeeCommand(
            '550e8400-e29b-41d4-a716-446655440000',
            'John',
            'Doe',
            '12345678K',
            '2008-06-14T00:00:00Z',
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
            '2008-06-14T00:00:00Z',
        );
        const handlerWithoutConfigAgeMajority = new CreateEmployeeCommandHandler(inMemoryRepository, mockClock, new ConfigService());


        await expect(handlerWithoutConfigAgeMajority.execute(command)).rejects.toThrow(
            "The value of AgeOfMajority doesn't exist in configuration"
        );
    })
})