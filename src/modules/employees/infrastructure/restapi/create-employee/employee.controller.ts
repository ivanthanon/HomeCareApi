import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateEmployeeCommand,
  CreateEmployeeCommandHandler,
} from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { EmployeeAlreadyExistsError } from 'src/modules/employees/application/errors/employeeAlreadyExistsError';
import { isAValidGuid } from 'src/modules/employees/domain/shared/utils';
import {
  GetEmployeeByIdQuery,
  GetEmployeeByIdQueryHandler,
} from 'src/modules/employees/application/get-employee-by-id/getEmployeeByIdQueryHandler';
import { EmployeeNotFoundError } from 'src/modules/employees/application/errors/employeeNotFoundError';
import { CreateEmployeeRequest } from './createEmployeeRequest';

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
  async getEmployeeById(
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.getEmployeeByIdQueryHandler.execute(
      new GetEmployeeByIdQuery(id),
    );

    if (!result.success) {
      if (result.error instanceof EmployeeNotFoundError) {
        return this.sendErrorResponse(
          response,
          HttpStatus.NOT_FOUND,
          'Not Found',
          result.error.message,
        );
      }

      return this.sendErrorResponse(
        response,
        HttpStatus.BAD_REQUEST,
        'Bad Request',
        result.error.message,
      );
    }

    return {
      id: result.value.id.value.toLowerCase(),
      firstName: result.value.firstName.value,
      lastName: result.value.lastName.value,
      documentNumber: result.value.documentNumber.value,
      dateOfBirth: result.value.dateOfBirth.value.toISOString(),
    };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  async createEmployee(
    @Body() createEmployeeRequest: CreateEmployeeRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const validationError = CreateEmployeeRequest.validate(createEmployeeRequest);
    if (validationError) {
      return this.sendErrorResponse(
        response,
        HttpStatus.BAD_REQUEST,
        'Bad Request',
        validationError,
      );
    }

    const command = new CreateEmployeeCommand(
      createEmployeeRequest.id,
      createEmployeeRequest.firstName,
      createEmployeeRequest.lastName,
      createEmployeeRequest.documentNumber,
      new Date(createEmployeeRequest.dateOfBirth),
    );
    const result = await this.createEmployeeCommandHandler.execute(command);

    if (!result.success) {
      if (result.error instanceof EmployeeAlreadyExistsError) {
        return this.sendErrorResponse(
          response,
          HttpStatus.CONFLICT,
          'Conflict',
          result.error.message,
        );
      }

      return this.sendErrorResponse(
        response,
        HttpStatus.BAD_REQUEST,
        'Bad Request',
        result.error.message,
      );
    }

    return;
  }


  private sendErrorResponse(
    response: Response,
    statusCode: HttpStatus,
    error: string,
    message: string,
  ) {
    response.status(statusCode);
    return { error, message, statusCode };
  }
}
