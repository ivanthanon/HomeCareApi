import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiProperty } from '@nestjs/swagger';
import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { isAValidDate, isAValidGuid } from 'src/modules/employees/domain/shared/utils';

export class CreateEmployeeRequest {
  @ApiProperty({ description: 'Employee unique identifier (GUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Employee first name', example: 'John' })
  firstName!: string;

  @ApiProperty({ description: 'Employee last name', example: 'Doe' })
  lastName!: string;

  @ApiProperty({ description: 'Employee document number', example: '12345678' })
  documentNumber!: string;

  @ApiProperty({ description: 'Employee date of birth', example: '1990-01-01' })
  dateOfBirth!: string;
}

@ApiTags('Employees')
@Controller({ path: 'employees' })
export class EmployeesController {
  constructor(
    private readonly createEmployeeCommandHandler: CreateEmployeeCommandHandler,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  async createEmployee(@Body() createEmployeeRequest: CreateEmployeeRequest) {

    this.validateRequest(createEmployeeRequest);

    const command = new CreateEmployeeCommand(
      createEmployeeRequest.id,
      createEmployeeRequest.firstName,
      createEmployeeRequest.lastName,
      createEmployeeRequest.documentNumber,
      new Date(createEmployeeRequest.dateOfBirth),
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
