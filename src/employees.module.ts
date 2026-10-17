import { Module } from '@nestjs/common';
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionPool, config as MssqlConfig } from 'mssql';
import { EmployeesController } from 'src/modules/employees/infrastructure/restapi/create-employee/employee.controller';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerEmployeeRepository';
import { SqlServerOutboxRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository';
import { SqlServerTransactionScope } from 'src/modules/employees/infrastructure/adapters/sqlServerTransactionScope';
import appConfig from './config/app.config';
import { DateClock } from './modules/employees/infrastructure/adapters/dateClock';
import { GetEmployeeByIdQueryHandler } from 'src/modules/employees/application/get-employee-by-id/getEmployeeByIdQueryHandler';
import { NestConfigurationProvider } from 'src/modules/employees/infrastructure/adapters/nestConfigurationProvider';
import { HttpExceptionLoggingFilter } from 'src/modules/employees/infrastructure/restapi/httpExceptionLogging.filter';

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
      provide: APP_FILTER,
      useFactory: (httpAdapterHost: HttpAdapterHost) =>
        new HttpExceptionLoggingFilter(httpAdapterHost),
      inject: [HttpAdapterHost],
    },
    {
      provide: ConnectionPool,
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get<MssqlConfig>('database');
        const pool = new ConnectionPool(dbConfig!);
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
      useFactory: (transactionScope: SqlServerTransactionScope) =>
        new SqlServerEmployeeRepository(transactionScope),
      inject: [SqlServerTransactionScope],
    },
    {
      provide: SqlServerOutboxRepository,
      useFactory: (transactionScope: SqlServerTransactionScope) =>
        new SqlServerOutboxRepository(transactionScope),
      inject: [SqlServerTransactionScope],
    },
    {
      provide: NestConfigurationProvider,
      useFactory: (configService: ConfigService) =>
        new NestConfigurationProvider(configService),
      inject: [ConfigService],
    },
    {
      provide: CreateEmployeeCommandHandler,
      useFactory: (
        employeeRepository: SqlServerEmployeeRepository,
        outboxRepository: SqlServerOutboxRepository,
        unitOfWork: SqlServerTransactionScope,
        configurationProvider: NestConfigurationProvider,
      ) =>
        new CreateEmployeeCommandHandler(
          employeeRepository,
          outboxRepository,
          unitOfWork,
          new DateClock(),
          configurationProvider,
        ),
      inject: [
        SqlServerEmployeeRepository,
        SqlServerOutboxRepository,
        SqlServerTransactionScope,
        NestConfigurationProvider,
      ],
    },
    {
      provide: GetEmployeeByIdQueryHandler,
      useFactory: (employeeRepository: SqlServerEmployeeRepository) =>
        new GetEmployeeByIdQueryHandler(employeeRepository),
      inject: [SqlServerEmployeeRepository],
    },
  ],
})
export class EmployeesModule {}
