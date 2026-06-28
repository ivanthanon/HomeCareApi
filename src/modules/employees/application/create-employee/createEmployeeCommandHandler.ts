import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { Employee } from 'src/modules/employees/domain/employee';
import { Ok, Result } from 'src/modules/employees/domain/shared/result';
import { Clock } from 'src/modules/employees/domain/shared/clock';
import { ConfigService } from '@nestjs/config';

export class CreateEmployeeCommand {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly documentNumber: string,
    readonly dateOfBirth: string,
  ) {}
}

export class CreateEmployeeCommandHandler {
  constructor(private readonly employeeRepository: EmployeeRepository, private readonly clock: Clock, private readonly configService: ConfigService) {}
  
  async execute(command: CreateEmployeeCommand): Promise<Result<void, Error>> {

    if (await this.employeeAlreadyExist(command)) {
      return Ok();
    }

    const ageOfMajority = this.configService.get<number>('app.ageOfMajority');

    if (ageOfMajority === undefined) {
      throw new Error("The value of AgeOfMajority doesn't exist in configuration")
    }
    
    const employeeResult = Employee.create(command.id, command.firstName, command.lastName, command.documentNumber, command.dateOfBirth, this.clock.now(), ageOfMajority);

    if (employeeResult.success === false) {
      return employeeResult;
    }

    await this.employeeRepository.create(employeeResult.value);
    
    return Ok();
  }

  private async employeeAlreadyExist(command: CreateEmployeeCommand) {
    return await this.employeeRepository.getBy(command.id) != null;
  }
}