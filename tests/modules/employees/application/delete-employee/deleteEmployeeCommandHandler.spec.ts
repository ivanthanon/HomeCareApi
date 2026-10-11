import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DeleteEmployeeCommand, DeleteEmployeeCommandHandler } from "src/modules/employees/application/delete-employee/deleteEmployeeCommandHandler";
import { TransactionScope } from "src/modules/employees/application/ports/transactionScope";
import { EmployeeInMemoryRepository } from "../../../../doubles/fake/EmployeeInMemoryRepository";
import { OutboxInMemoryRepository } from "../../../../doubles/fake/OutboxInMemoryRepository";
import { DateClockStub } from "../../../../doubles/stub/dateClockStub";
import { assertOutboxEventInMemory } from "../../../../helpers/assert/OutboxTestHelper";
import { Clock } from "src/modules/employees/domain/shared/clock";
import { Employee } from "src/modules/employees/domain/employee";
import { EmployeeDeletedV1 } from "src/modules/employees/domain/events/EmployeeDeletedV1";
import { Failure } from "src/modules/employees/domain/shared/result";

describe('DeleteEmployeeCommandHandler', () => {
    let handler: DeleteEmployeeCommandHandler;
    let inMemoryRepository: EmployeeInMemoryRepository;
    let outboxInMemoryRepository: OutboxInMemoryRepository;
    let transactionScope: TransactionScope & { execute: ReturnType<typeof vi.fn> };
    let mockClock: Clock;

    const anExistingEmployee = () => Employee.reconstitute(
        '550e8400-e29b-41d4-a716-446655440000',
        'John',
        'Doe',
        '12345678K',
        new Date('1991-06-13T00:00:00.000Z'),
    );

    beforeEach(() => {
        inMemoryRepository = new EmployeeInMemoryRepository();
        outboxInMemoryRepository = new OutboxInMemoryRepository();
        transactionScope = {
            execute: vi.fn(async (work) => work()),
        };
        mockClock = new DateClockStub();
        handler = new DeleteEmployeeCommandHandler(
            inMemoryRepository,
            outboxInMemoryRepository,
            transactionScope,
            mockClock,
        );
    });

    it('should soft delete the employee so it is no longer returned by getBy', async () => {
        inMemoryRepository.employeeList.push(anExistingEmployee());

        const result = await handler.execute(
            new DeleteEmployeeCommand('550e8400-e29b-41d4-a716-446655440000'),
        );

        expect(result.success).toBe(true);
        const employee = await inMemoryRepository.getBy('550e8400-e29b-41d4-a716-446655440000');
        expect(employee).toBeNull();
        expect(inMemoryRepository.employeeList[0].deletedAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    });

    it('should persist EmployeeDeleted.v1 domain event in outbox', async () => {
        inMemoryRepository.employeeList.push(anExistingEmployee());

        await handler.execute(new DeleteEmployeeCommand('550e8400-e29b-41d4-a716-446655440000'));

        assertOutboxEventInMemory(outboxInMemoryRepository.events, new EmployeeDeletedV1(
            '550e8400-e29b-41d4-a716-446655440000',
            new Date('2026-01-01T00:00:00.000Z'),
        ));
    });

    it('should return a failure when the employee does not exist', async () => {
        const result = await handler.execute(
            new DeleteEmployeeCommand('550e8400-e29b-41d4-a716-446655440000'),
        );

        expect(result.success).toBe(false);
        const failure = result as Failure<Error>;
        expect(failure.error.message).toBe('Employee not found');
        expect(inMemoryRepository.employeeList.length).toBe(0);
        expect(outboxInMemoryRepository.events.length).toBe(0);
    });

    it('should execute within a transactionScope when deleting an employee successfully', async () => {
        inMemoryRepository.employeeList.push(anExistingEmployee());

        await handler.execute(new DeleteEmployeeCommand('550e8400-e29b-41d4-a716-446655440000'));

        expect(transactionScope.execute).toHaveBeenCalledOnce();
    });
});
