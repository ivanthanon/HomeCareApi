export class EmployeeAlreadyExistsError extends Error {
  constructor() {
    super('Employee already exists');
    this.name = 'EmployeeAlreadyExistsError';
  }
}
