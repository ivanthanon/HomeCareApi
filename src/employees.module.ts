import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionPool } from 'mssql';
import { EmployeesController } from 'src/modules/employees/infrastructure/restapi/create-employee/employee.controller';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerEmployeeRepository';
import { SqlServerOutboxRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository';
import { SqlServerTransactionScope } from 'src/modules/employees/infrastructure/adapters/sqlServerTransactionScope';
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
      provide: SqlServerTransactionScope,
      useFactory: (pool: ConnectionPool) => new SqlServerTransactionScope(pool),
      inject: [ConnectionPool],
    },
    {
      provide: SqlServerEmployeeRepository,
      useFactory: (transactionScope: SqlServerTransactionScope) => new SqlServerEmployeeRepository(transactionScope),
      inject: [SqlServerTransactionScope],
    },
    {
      provide: SqlServerOutboxRepository,
      useFactory: (transactionScope: SqlServerTransactionScope) => new SqlServerOutboxRepository(transactionScope),
      inject: [SqlServerTransactionScope],
    },
    {
      provide: CreateEmployeeCommandHandler, 
      useFactory: (
        employeeRepository: SqlServerEmployeeRepository,
        outboxRepository: SqlServerOutboxRepository,
        unitOfWork: SqlServerTransactionScope,
        configService: ConfigService,
      ) => new CreateEmployeeCommandHandler(employeeRepository, outboxRepository, unitOfWork, new DateClock(), configService),
      inject: [SqlServerEmployeeRepository, SqlServerOutboxRepository, SqlServerTransactionScope, ConfigService]
    },
  ],
})

export class EmployeesModule { }
