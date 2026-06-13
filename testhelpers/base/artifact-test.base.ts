import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionPool } from 'mssql';
import { EmployeesModule } from 'src/employees.module';
import { TestcontainerSetup, ITestContainerConfig } from './testcontainer-setup';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/use-cases/commands/create-employee/createEmployeeCommandHandler';
import { DateClockStub } from 'src/modules/employees/infrastructure/adapters/driven/dateClock';
import { SqlServerEmployeeRepository } from 'src/modules/employees/infrastructure/adapters/driven/SqlServerEmployeeRepository';

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
        envFilePath: '.test.settings.env'
      })],      
    })
      .overrideProvider(ConnectionPool)
      .useValue(this.dbConnection)
      .overrideProvider(CreateEmployeeCommandHandler)
      .useFactory({
        factory: () => new CreateEmployeeCommandHandler(
        new SqlServerEmployeeRepository(this.dbConnection),
        new DateClockStub()
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
