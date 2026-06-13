import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionPool } from 'mssql';
import { EmployeesController } from 'src/modules/employees/infrastructure/restapi/employee.controller';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/use-cases/commands/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/driven/SqlServerEmployeeRepository';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import appConfig from './config/app.config';

@Module({
  controllers: [EmployeesController],
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [appConfig],
    }),
    EmployeesModule,
  ],
  providers: [
    {
      provide: ConnectionPool,
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('settings.database');
        const pool = new ConnectionPool(dbConfig);
        return pool.connect();
      },
      inject: [ConfigService],
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

export class EmployeesModule { }
