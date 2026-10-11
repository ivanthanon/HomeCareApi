import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { OutboxRepository } from 'src/modules/employees/application/ports/outbox.repository';
import { Err, Ok, Result } from 'src/modules/employees/domain/shared/result';
import { Clock } from 'src/modules/employees/domain/shared/clock';
import { TransactionScope } from 'src/modules/employees/application/ports/transactionScope';

export class DeleteEmployeeCommand {
  constructor(readonly id: string) {}
}

export class DeleteEmployeeCommandHandler {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly transactionScope: TransactionScope,
    private readonly clock: Clock,
  ) {}

  async execute(command: DeleteEmployeeCommand): Promise<Result<void, Error>> {
    const employee = await this.employeeRepository.getBy(command.id);

    if (employee === null) {
      return Err(new Error('Employee not found'));
    }

    const deleteResult = employee.delete(this.clock.now());
    if (deleteResult.success === false) {
      return deleteResult;
    }

    await this.transactionScope.execute(async () => {
      const domainEvents = employee.pullDomainEvents();

      for (const event of domainEvents) {
        await this.outboxRepository.save(event);
      }

      await this.employeeRepository.softDelete(employee);
    });

    return Ok();
  }
}
