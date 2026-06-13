import { Module } from '@nestjs/common';
import { ConnectionPool } from 'mssql';
import * as fs from 'fs';
import * as path from 'path';
import { EmployeesController } from 'src/modules/employees/infrastructure/adapters/driving/controllers/employee.controller';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/use-cases/commands/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/driven/SqlServerEmployeeRepository';
import { EmployeeRepository } from 'src/modules/employees/application/ports/driven/employee.repository';

@Module({
  controllers: [EmployeesController],
  providers: [
    {
      provide: 'DATABASE_CONFIG',
      useFactory: () => {
        const env = process.env.NODE_ENV || 'development';
        console.log("the environment is: " + env);
        const configPath = path.resolve(__dirname, '../config/database.json');
        const raw = fs.readFileSync(configPath, 'utf-8');
        const allConfigs = JSON.parse(raw);
        const config = allConfigs[env];
        if (!config) {
          throw new Error(`Database config not found for environment: ${env}`);
        }
        return config;
      },
    },
    {
      provide: ConnectionPool,
      useFactory: (databaseConfig: any) => new ConnectionPool(databaseConfig),
      inject: ['DATABASE_CONFIG'],
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
