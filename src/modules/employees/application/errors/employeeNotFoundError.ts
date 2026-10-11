export class EmployeeNotFoundError extends Error {
  constructor(id: string) {
    super(`Employee with id ${id} was not found`);
    this.name = 'EmployeeNotFoundError';
  }
}
