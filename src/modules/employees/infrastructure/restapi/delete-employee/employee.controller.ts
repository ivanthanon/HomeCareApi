import { Controller, Delete, Param, HttpCode, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiNoContentResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { DeleteEmployeeCommand, DeleteEmployeeCommandHandler } from 'src/modules/employees/application/delete-employee/deleteEmployeeCommandHandler';
import { isAValidGuid } from 'src/modules/employees/domain/shared/utils';

@ApiTags('Employees')
@Controller({ path: 'employees' })
export class DeleteEmployeeController {
  constructor(
    private readonly deleteEmployeeCommandHandler: DeleteEmployeeCommandHandler,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiParam({ name: 'id', description: 'Employee unique identifier (GUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  async deleteEmployee(@Param('id') id: string) {
    if (!isAValidGuid(id)) {
      throw new BadRequestException('Employee id must be a valid guid');
    }

    const result = await this.deleteEmployeeCommandHandler.execute(new DeleteEmployeeCommand(id));

    if (result.success === false) {
      throw new NotFoundException(result.error.message);
    }

    return;
  }
}
