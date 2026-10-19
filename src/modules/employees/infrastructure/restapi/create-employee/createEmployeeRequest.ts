import { ApiProperty } from '@nestjs/swagger';
import {
  isAValidDate,
  isAValidGuid,
} from 'src/modules/employees/domain/shared/utils';

export class CreateEmployeeRequest {
  @ApiProperty({
    description: 'Employee unique identifier (GUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({ description: 'Employee first name', example: 'John' })
  firstName!: string;

  @ApiProperty({ description: 'Employee last name', example: 'Doe' })
  lastName!: string;

  @ApiProperty({ description: 'Employee document number', example: '12345678' })
  documentNumber!: string;

  @ApiProperty({ description: 'Employee date of birth', example: '1990-01-01' })
  dateOfBirth!: string;

  static validate(request: CreateEmployeeRequest): string | undefined {
    if (!request.firstName) {
      return 'Employee name must not be empty';
    }

    if (!request.lastName) {
      return 'Employee lastname must not be empty';
    }

    if (!isAValidGuid(request.id)) {
      return 'Employee id must be a valid guid';
    }

    if (!request.documentNumber) {
      return 'Employee document number must not be empty';
    }

    if (!isAValidDate(request.dateOfBirth)) {
      return 'Employee date of birth number must be a valid date';
    }
  }
}