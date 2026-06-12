import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { CreateEmployeeCommandHandler } from '../../app/commands/createEmployee/createEmployeeCommandHandler';
import { CreateEmployeeCommand } from '../../app/commands/createEmployee/createEmployeeCommandHandler';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly createEmployeeCommandHandler: CreateEmployeeCommandHandler,
  ) {}

  @Post()
  @HttpCode(201)
  async createEmployee(@Body() createEmployeeRequest: CreateEmployeeRequest) {
    const command = new CreateEmployeeCommand(
      createEmployeeRequest.id,
      createEmployeeRequest.firstName,
      createEmployeeRequest.lastName,
      createEmployeeRequest.documentNumber,
      createEmployeeRequest.dateOfBirth,
    );

    return await this.createEmployeeCommandHandler.execute(command);
  }
}

export interface CreateEmployeeRequest {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: string;
}