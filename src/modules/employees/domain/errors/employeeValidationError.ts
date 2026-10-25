export type EmployeeValidationCode =
  | 'employee.id.invalid'
  | 'employee.name.too_short'
  | 'employee.document_number.invalid_length'
  | 'employee.document_number.invalid_suffix'
  | 'employee.date_of_birth.invalid'
  | 'employee.date_of_birth.underage';

export class EmployeeValidationError extends Error {
  constructor(
    readonly code: EmployeeValidationCode,
    message: string,
  ) {
    super(message);
    this.name = 'EmployeeValidationError';
  }
}
