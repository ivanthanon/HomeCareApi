import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';

@Controller({ path: 'employees' })
export class EmployeesController {
  constructor(
    private readonly createEmployeeCommandHandler: CreateEmployeeCommandHandler,
  ) {}

  @Post()
  @HttpCode(201)
  async createEmployee(@Body() createEmployeeRequest: CreateEmployeeRequest) {

    if (!createEmployeeRequest.firstName) {
      throw new BadRequestException('Employee name must not be empty');
    }

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
}

export interface CreateEmployeeRequest {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: string;
}