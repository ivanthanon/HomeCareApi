import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { isAValidDate, isAValidGuid } from 'src/modules/employees/domain/shared/utils';

@Controller({ path: 'employees' })
export class EmployeesController {
  constructor(
    private readonly createEmployeeCommandHandler: CreateEmployeeCommandHandler,
  ) {}

  @Post()
  @HttpCode(201)
  async createEmployee(@Body() createEmployeeRequest: CreateEmployeeRequest) {

    this.validateRequest(createEmployeeRequest);

    const command = new CreateEmployeeCommand(
      createEmployeeRequest.id,
      createEmployeeRequest.firstName,
      createEmployeeRequest.lastName,
      createEmployeeRequest.documentNumber,
      createEmployeeRequest.dateOfBirth,
    );
    const result = await this.createEmployeeCommandHandler.execute(command);

    if (result.success === false) {
      throw new BadRequestException(result.error.message);
    }

    return;
  }

  private validateRequest(createEmployeeRequest: CreateEmployeeRequest) {
    if (!createEmployeeRequest.firstName) {
      throw new BadRequestException('Employee name must not be empty');
    }


    if (!createEmployeeRequest.lastName) {
      throw new BadRequestException('Employee lastname must not be empty');
    }

    if (!isAValidGuid(createEmployeeRequest.id)) {
      throw new BadRequestException('Employee id must be a valid guid');
    }

    if (!createEmployeeRequest.documentNumber) {
      throw new BadRequestException('Employee document number must not be empty');
    }

    if (!isAValidDate(createEmployeeRequest.dateOfBirth)) {
      throw new BadRequestException('Employee date of birth number must be a valid date');
    }
  }
}

export interface CreateEmployeeRequest {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: string;
}