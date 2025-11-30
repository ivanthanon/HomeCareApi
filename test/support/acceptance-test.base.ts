import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import sql, { config as SqlConfig } from 'mssql';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers'; 
import { AppModule } from '../../src/app.module';

const testContainerSettings = require('./testContainerSettings.json');

interface ITestContainerConfig {
  sqlServer: {
    image: string;
    exposedPort: number;
    environment: Record<string, string>;
    waitStrategy: {
      message: string;
    };
    user: string;
  };
  databaseConfig: {
    connectionOptions: SqlConfig['options'];
    testDbName: string;
  };
}

const TestContainerConfig = testContainerSettings as ITestContainerConfig;

export abstract class AcceptanceTestBase {
  protected app: INestApplication;
  protected dbConnection: sql.ConnectionPool;
  
  protected testDbName = `${TestContainerConfig.databaseConfig.testDbName}_${Date.now()}`;
  private host: string;
  private port: number;
  private password = `Password${crypto.randomUUID()}!`;

  private testContainer: StartedTestContainer | null = null;

  async setupDatabase(): Promise<void> {
    const container = await new GenericContainer(TestContainerConfig.sqlServer.image)
      .withEnvironment({ 
        ...TestContainerConfig.sqlServer.environment,
        SA_PASSWORD: this.password 
      })
      .withExposedPorts(TestContainerConfig.sqlServer.exposedPort) 
      .withWaitStrategy(Wait.forLogMessage(new RegExp(TestContainerConfig.sqlServer.waitStrategy.message))) 
      .start();

    this.testContainer = container;

    this.host = container.getHost();
    this.port = container.getMappedPort(TestContainerConfig.sqlServer.exposedPort);

    console.log(`[TEST] Container live. Host: ${this.host}, Port: ${this.port}, Pass: ${this.password.substring(0, 5)}...`);

    await this.createTestDatabase();
    const dbConfig = this.getConnectionConfig(this.testDbName);
    this.dbConnection = new sql.ConnectionPool(dbConfig);
    await this.dbConnection.connect();

    console.log(`[TEST] ✓ Connected to dynamic DB: ${this.testDbName}`);

    await this.runMigrations();
  }

  private getConnectionConfig(database: string): SqlConfig {
    return {
      server: this.host,
      port: this.port,
      user: TestContainerConfig.sqlServer.user, 
      password: this.password,
      database: database,
      authentication: { type: 'default' },
      options: TestContainerConfig.databaseConfig.connectionOptions,
    };
  }

  private async createTestDatabase(): Promise<void> {
    const masterConfig = this.getConnectionConfig('master');
    const masterPool = new sql.ConnectionPool(masterConfig);
    
    await masterPool.connect();
    await masterPool.request().query(`CREATE DATABASE ${this.testDbName}`);
    await masterPool.close();
  }

  private async runMigrations(): Promise<void> {
    const { MigrationRunner } = await import('../../src/database/migrationRunner');
    const migrationRunner = new MigrationRunner(this.dbConnection);
    await migrationRunner.runMigrations();
    console.log('[TEST] ✓ Migrations applied correctly');
  }

  async setupApplication(): Promise<void> {
    console.log('[TEST] Initializing Nest application...');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();
    console.log('[TEST] ✓ Nest application initialized');
  }

  async teardown(): Promise<void> {
    if (this.app) await this.app.close();
    if (this.dbConnection) await this.dbConnection.close();

    if (this.testContainer) {
      await this.testContainer.stop();
      console.log('[TEST] ✓ Container stopped');
    }
  }

  async executeQuery(query: string, params?: Record<string, any>): Promise<any> {
    const request = this.dbConnection.request();
    if (params) {
      Object.entries(params).forEach(([key, value]) => request.input(key, value));
    }
    return request.query(query);
  }

  async cleanTable(tableName: string): Promise<void> {
    await this.executeQuery(`DELETE FROM ${tableName}`);
  }

  async cleanAllTables(): Promise<void> {
    await this.cleanTable('workers');
  }
}