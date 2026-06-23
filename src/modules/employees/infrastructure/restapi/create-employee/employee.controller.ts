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

    
    if (!createEmployeeRequest.lastName) {
      throw new BadRequestException('Employee lastname must not be empty');
    }

    if (!isAValidGuid(createEmployeeRequest.id)) {
      throw new BadRequestException('Employee id must be a valid guid');
    }

    if (!createEmployeeRequest.documentNumber) {
      throw new BadRequestException('Employee document number must not be empty')
    }

    const dateOfBirth = Date.parse(createEmployeeRequest.dateOfBirth);
    
    if (isNaN(dateOfBirth)) {
        throw new BadRequestException('Employee date of birth number must be a valid date')
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


function isAValidGuid(value: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(value);
}

export interface CreateEmployeeRequest {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: string;
}