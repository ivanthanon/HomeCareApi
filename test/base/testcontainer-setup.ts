import sql, { config as SqlConfig } from 'mssql';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

export interface ITestContainerConfig {
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

export class TestcontainerSetup {
  protected dbConnection: sql.ConnectionPool;
  protected testDbName: string;
  private host: string;
  private port: number;
  private password: string;
  private testContainer: StartedTestContainer | null = null;
  private config: ITestContainerConfig;

  constructor(config: ITestContainerConfig) {
    this.config = config;
    this.testDbName = `${config.databaseConfig.testDbName}_${Date.now()}`;
    this.password = `Password${crypto.randomUUID()}!`;
  }

  async startDatabaseTestContainer(): Promise<void> {
    const container = await new GenericContainer(this.config.sqlServer.image)
      .withEnvironment({
        ...this.config.sqlServer.environment,
        SA_PASSWORD: this.password
      })
      .withExposedPorts(this.config.sqlServer.exposedPort)
      .withWaitStrategy(Wait.forLogMessage(new RegExp(this.config.sqlServer.waitStrategy.message)))
      .start();

    this.testContainer = container;
    this.host = container.getHost();
    this.port = container.getMappedPort(this.config.sqlServer.exposedPort);

    console.log(`[TEST] Container live. Host: ${this.host}, Port: ${this.port}, Pass: ${this.password.substring(0, 5)}...`);

    await this.createTestDatabase();
    const dbConfig = this.getConnectionConfig(this.testDbName);
    this.dbConnection = new sql.ConnectionPool(dbConfig);
    await this.dbConnection.connect();

    console.log(`[TEST] ✓ Connected to dynamic DB: ${this.testDbName}`);

    const { MigrationRunner } = await import('../../src/database/migrationRunner');
    const migrationRunner = new MigrationRunner(this.dbConnection);
    await migrationRunner.runMigrations();
    console.log('[TEST] ✓ Migrations applied correctly');
  }

  getConnectionConfig(database: string): SqlConfig {
    return {
      server: this.host,
      port: this.port,
      user: this.config.sqlServer.user,
      password: this.password,
      database: database,
      authentication: { type: 'default' },
      options: this.config.databaseConfig.connectionOptions,
    };
  }

  async stop(): Promise<void> {
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

  private async createTestDatabase(): Promise<void> {
    const masterConfig = this.getConnectionConfig('master');
    const masterPool = new sql.ConnectionPool(masterConfig);
    await masterPool.connect();
    await masterPool.request().query(`CREATE DATABASE ${this.testDbName}`);
    await masterPool.close();
  }
}
