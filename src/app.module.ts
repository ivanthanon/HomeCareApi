import { Module, Scope } from '@nestjs/common';
import { ConnectionPool } from 'mssql';
import { EmployeesController } from './infrastructure/controllers/employee.controller';
import { CreateEmployeeCommandHandler } from './app/commands/createEmployee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from './infrastructure/adapters/SqlServerEmployeeRepository';

@Module({
  controllers: [EmployeesController],
  providers: [
    CreateEmployeeCommandHandler,
    { provide: 'EMPLOYEE_REPOSITORY', useClass: SqlServerEmployeeRepository, scope: Scope.REQUEST },
    { provide: ConnectionPool, useFactory: () => { throw new Error('ConnectionPool not configured'); } },
  ],
})
export class AppModule {}
