import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionPool } from 'mssql';
import { EmployeesModule } from 'src/employees.module';
import {
  TestcontainerSetup,
  ITestContainerConfig,
} from './testcontainer-setup';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerEmployeeRepository';
import { SqlServerOutboxRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository';
import { SqlServerTransactionScope } from 'src/modules/employees/infrastructure/adapters/sqlServerTransactionScope';
import { NestConfigurationProvider } from 'src/modules/employees/infrastructure/adapters/nestConfigurationProvider';
import { DateClockStub } from 'tests/doubles/stub/dateClockStub';
import testConfig from 'tests/base/test.config.json';
import { LoggerFake } from 'tests/doubles/fake/LoggerFake';
import { LoggingCommandHandler } from 'src/modules/employees/application/decorators/loggingCommandHandler';

const testContainerSettings = require('./testContainerSettings.json');
const config = testContainerSettings as ITestContainerConfig;

export abstract class ArtifactTestBase extends TestcontainerSetup {
  protected app!: INestApplication;
  readonly commandLogger = new LoggerFake();

  constructor() {
    super(config);
  }

  async setupApplication(): Promise<void> {
    console.log('[TEST] Initializing Nest application...');

    const transactionScope = new SqlServerTransactionScope(this.dbConnection);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        EmployeesModule,
        ConfigModule.forRoot({
          envFilePath: '.test.settings.env',
          load: [() => testConfig],
        }),
      ],
    })
      .overrideProvider(ConnectionPool)
      .useValue(this.dbConnection)
      .overrideProvider(CreateEmployeeCommandHandler)
      .useFactory({
        factory: () =>
          new LoggingCommandHandler(
            new CreateEmployeeCommandHandler(
              new SqlServerEmployeeRepository(transactionScope),
              new SqlServerOutboxRepository(transactionScope),
              transactionScope,
              new DateClockStub(),
              new NestConfigurationProvider(new ConfigService(testConfig)),
            ),
            this.commandLogger,
          ),
      })
      .compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();
    console.log('[TEST] ✓ Nest application initialized');
  }

  async teardown(): Promise<void> {
    if (this.app) await this.app.close();
    await this.stop();
  }
}
