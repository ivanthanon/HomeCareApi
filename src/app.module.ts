import { Module } from '@nestjs/common';
import { EmployeesController } from './infrastructure/controllers/employee.controller';
import { CreateEmployeeCommandHandler } from './app/commands/createEmployee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from './infrastructure/adapters/SqlServerEmployeeRepository';

@Module({
  controllers: [EmployeesController],
  providers: [
    CreateEmployeeCommandHandler,
    { provide: 'EMPLOYEE_REPOSITORY', useClass: SqlServerEmployeeRepository },
  ],
})
export class AppModule {}
