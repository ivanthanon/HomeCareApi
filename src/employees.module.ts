import { Module, Scope } from '@nestjs/common';
import { ConnectionPool } from 'mssql';
import { EmployeesController } from 'src/modules/employees/infrastructure/adapters/driving/controllers/employee.controller';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/use-cases/commands/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/driven/SqlServerEmployeeRepository';

@Module({
  controllers: [EmployeesController],
  providers: [
    CreateEmployeeCommandHandler,
    { provide: 'EMPLOYEE_REPOSITORY', useClass: SqlServerEmployeeRepository, scope: Scope.REQUEST },
    { provide: ConnectionPool, useFactory: () => { throw new Error('ConnectionPool not configured'); } },
  ],
})
export class EmployeesModule {}
