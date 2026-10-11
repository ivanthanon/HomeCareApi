import { Controller, Post, Body, HttpCode, BadRequestException, ConflictException, Get, Param, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiProperty, ApiOkResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { EmployeeAlreadyExistsError } from 'src/modules/employees/application/errors/employeeAlreadyExistsError';
import { isAValidDate, isAValidGuid } from 'src/modules/employees/domain/shared/utils';
import { GetEmployeeByIdQueryHandler, GetEmployeeByIdQuery } from 'src/modules/employees/application/get-employee-by-id/getEmployeeByIdQueryHandler';
import { EmployeeNotFoundError } from 'src/modules/employees/application/errors/employeeNotFoundError';

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
    private readonly getEmployeeByIdQueryHandler: GetEmployeeByIdQueryHandler,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee unique identifier (GUID)' })
  @ApiOkResponse({ description: 'Employee found' })
  @ApiBadRequestResponse({ description: 'Employee ID is not a valid GUID' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  async getEmployeeById(@Param('id') id: string) {
    this.ValidateRequests(id);

    const result = await this.getEmployeeByIdQueryHandler.execute(
      new GetEmployeeByIdQuery(id),
    );

    if (result.success === false) {
      if (result.error instanceof EmployeeNotFoundError) {
        throw new NotFoundException(result.error.message);
      }

      throw new InternalServerErrorException(result.error.message);
    }

    return {
      id: result.value.id.value.toLowerCase(),
      firstName: result.value.firstName.value,
      lastName: result.value.lastName.value,
      documentNumber: result.value.documentNumber.value,
      dateOfBirth: result.value.dateOfBirth.value.toISOString(),
    };
  }

  @Get()
  async getEmployeeWithoutId() {
    throw new BadRequestException('Employee id is required');
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  async createEmployee(@Body() createEmployeeRequest: CreateEmployeeRequest) {

    this.validateCreateEmployeeRequest(createEmployeeRequest);

    const command = new CreateEmployeeCommand(
      createEmployeeRequest.id,
      createEmployeeRequest.firstName,
      createEmployeeRequest.lastName,
      createEmployeeRequest.documentNumber,
      new Date(createEmployeeRequest.dateOfBirth),
    );
    const result = await this.createEmployeeCommandHandler.execute(command);

    if (result.success === false) {
      if (result.error instanceof EmployeeAlreadyExistsError) {
        throw new ConflictException(result.error.message);
      }
      throw new BadRequestException(result.error.message);
    }

    return;
  }

  private ValidateRequests(id: string) {
    if (typeof id !== 'string' || !isAValidGuid(id)) {
      throw new BadRequestException('Employee id must be a valid guid');
    }
  }

  private validateCreateEmployeeRequest(createEmployeeRequest: CreateEmployeeRequest) {
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
