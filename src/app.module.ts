import { Module } from '@nestjs/common';
import { EmployeesController } from './api/controllers/employee.controller';
import { CreateEmployeeCommandHandler } from './app/commands/createEmployee/createEmployeeCommandHandler';

@Module({
  controllers: [EmployeesController],
  providers: [CreateEmployeeCommandHandler],
})
export class AppModule {}
