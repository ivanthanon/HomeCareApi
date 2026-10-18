import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { OutboxRepository } from 'src/modules/employees/application/ports/outbox.repository';
import { Employee } from 'src/modules/employees/domain/employee';
import { Err, Ok, Result } from 'src/modules/employees/domain/shared/result';
import { Clock } from 'src/modules/employees/domain/shared/clock';
import { TransactionScope } from 'src/modules/employees/application/ports/transactionScope';
import { EmployeeAlreadyExistsError } from 'src/modules/employees/application/errors/employeeAlreadyExistsError';
import { ForRetrievingMajorityAge } from 'src/modules/employees/application/ports/forRetrievingMajorityAge';
import { EmployeeId } from 'src/modules/employees/domain/value-objects/EmployeeId';
import { DocumentNumber } from 'src/modules/employees/domain/value-objects/DocumentNumber';
import { CommandHandler } from 'src/modules/employees/application/ports/commandHandler';

export class CreateEmployeeCommand {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly documentNumber: string,
    readonly dateOfBirth: Date,
  ) {}
}

export class CreateEmployeeCommandHandler implements CommandHandler<
  CreateEmployeeCommand,
  void
> {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly transactionScope: TransactionScope,
    private readonly clock: Clock,
    private readonly configurationProvider: ForRetrievingMajorityAge,
  ) {}

  async execute(command: CreateEmployeeCommand): Promise<Result<void, Error>> {
    return this.transactionScope.execute(async () => {
      if (await this.employeeAlreadyExist(command)) {
        return Err(new EmployeeAlreadyExistsError());
      }

      const ageOfMajority = this.configurationProvider.getAgeOfMajority();

      if (ageOfMajority === undefined) {
        throw new Error(
          "The value of AgeOfMajority doesn't exist in configuration",
        );
      }

      const employeeResult = Employee.create(
        command.id,
        command.firstName,
        command.lastName,
        command.documentNumber,
        command.dateOfBirth,
        this.clock.now(),
        ageOfMajority,
      );

      if (!employeeResult.success) {
        return employeeResult;
      }

      const domainEvents = employeeResult.value.pullDomainEvents();

      for (const event of domainEvents) {
        await this.outboxRepository.save(event);
      }

      await this.employeeRepository.create(employeeResult.value);

      return Ok();
    });
  }

  private async employeeAlreadyExist(command: CreateEmployeeCommand) {
    const employeeWithId = await this.employeeRepository.getBy(
      new EmployeeId(command.id),
    );
    if (employeeWithId !== null) {
      return true;
    }

    return (
      (await this.employeeRepository.getByDocumentNumber(
        new DocumentNumber(command.documentNumber),
      )) !== null
    );
  }
}
