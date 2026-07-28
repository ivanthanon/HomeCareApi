import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionPool } from 'mssql';
import { EmployeesController } from 'src/modules/employees/infrastructure/restapi/create-employee/employee.controller';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerEmployeeRepository';
import { SqlServerOutboxRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository';
import { SqlServerUnitOfWork } from 'src/modules/employees/infrastructure/adapters/sqlServerUnitOfWork';
import appConfig from './config/app.config';
import { DateClock } from './modules/employees/infrastructure/adapters/dateClock';

@Module({
  controllers: [EmployeesController],
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [appConfig],
    }),
  ],
  providers: [
    {
      provide: ConnectionPool,
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
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
      provide: SqlServerOutboxRepository,
      useFactory: (pool: ConnectionPool) => new SqlServerOutboxRepository(pool),
      inject: [ConnectionPool],
    },
    {
      provide: SqlServerUnitOfWork,
      useFactory: (pool: ConnectionPool) => new SqlServerUnitOfWork(pool),
      inject: [ConnectionPool],
    },
    {
      provide: CreateEmployeeCommandHandler, 
      useFactory: (
        employeeRepository: SqlServerEmployeeRepository,
        outboxRepository: SqlServerOutboxRepository,
        unitOfWork: SqlServerUnitOfWork,
        configService: ConfigService,
      ) => new CreateEmployeeCommandHandler(employeeRepository, outboxRepository, unitOfWork, new DateClock(), configService),
      inject: [SqlServerEmployeeRepository, SqlServerOutboxRepository, SqlServerUnitOfWork, ConfigService]
    },
  ],
})

export class EmployeesModule { }
