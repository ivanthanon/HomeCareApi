import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionPool } from 'mssql';
import { EmployeesModule } from 'src/employees.module';
import { TestcontainerSetup, ITestContainerConfig } from './testcontainer-setup';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerEmployeeRepository';
import { SqlServerOutboxRepository } from 'src/modules/employees/infrastructure/adapters/SqlServerOutboxRepository';
import { SqlServerUnitOfWork } from 'src/modules/employees/infrastructure/adapters/sqlServerUnitOfWork';
import { DateClockStub } from 'tests/doubles/stub/dateClockStub';
import testConfig from 'tests/base/test.config.json';

const testContainerSettings = require('./testContainerSettings.json');
const config = testContainerSettings as ITestContainerConfig;

export abstract class ArtifactTestBase extends TestcontainerSetup {
  protected app!: INestApplication;

  constructor() {
    super(config);
  }

  async setupApplication(): Promise<void> {
    console.log('[TEST] Initializing Nest application...');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EmployeesModule, ConfigModule.forRoot({
        envFilePath: '.test.settings.env',
        load: [() => testConfig],
      })],      
    })
      .overrideProvider(ConnectionPool)
      .useValue(this.dbConnection)
      .overrideProvider(CreateEmployeeCommandHandler)
      .useFactory({
        factory: () => new CreateEmployeeCommandHandler(
          new SqlServerEmployeeRepository(this.dbConnection),
          new SqlServerOutboxRepository(this.dbConnection),
          new SqlServerUnitOfWork(this.dbConnection),
          new DateClockStub(),
          new ConfigService(testConfig),
        )
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
