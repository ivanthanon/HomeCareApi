import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConnectionPool } from 'mssql';
import { EmployeesController } from 'src/modules/employees/infrastructure/adapters/driving/controllers/employee.controller';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/use-cases/commands/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/driven/SqlServerEmployeeRepository';
import { EmployeeRepository } from 'src/modules/employees/application/ports/driven/employee.repository';

@Module({
  controllers: [EmployeesController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EmployeesModule,
  ],
  providers: [
    {
      provide: ConnectionPool,
      useFactory: (databaseConfig: any) => new ConnectionPool(databaseConfig),
      inject: [ConfigModule],
    },
    {
      provide: SqlServerEmployeeRepository,
      useFactory: (pool: ConnectionPool) => new SqlServerEmployeeRepository(pool),
      inject: [ConnectionPool],
    },
    {
      provide: CreateEmployeeCommandHandler,
      useFactory: (employeeRepository: EmployeeRepository) => new CreateEmployeeCommandHandler(employeeRepository),
      inject: [SqlServerEmployeeRepository],
    },
  ],
})
export class EmployeesModule {}
