import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionPool } from 'mssql';
import { EmployeesModule } from 'src/employees.module';
import { TestcontainerSetup, ITestContainerConfig } from './testcontainer-setup';

const testContainerSettings = require('./testContainerSettings.json');
const config = testContainerSettings as ITestContainerConfig;

export abstract class ArtifactTestBase extends TestcontainerSetup {
  protected app!: INestApplication;

  constructor() {
    super(config);
  }

  async setupApplication(): Promise<void> {
    console.log('[TEST] Initializing Nest application...');

    const databaseConfig = this.getConnectionConfig(this.testDbName);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EmployeesModule],
    })
      .overrideProvider(ConnectionPool)
      .useValue(this.dbConnection)
      .overrideProvider('DATABASE_CONFIG')
      .useValue(databaseConfig)
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
