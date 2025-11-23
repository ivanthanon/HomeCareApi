import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import sql from 'mssql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { AppModule } from '../../src/app.module';

export abstract class AcceptanceTestBase {
  protected app: INestApplication;
  protected dbConnection: sql.ConnectionPool;
  protected testDbName = `test_homecare_${Date.now()}`;

  // Las propiedades son 'protected' para permitir la asignación del puerto dinámico
  protected MSSQL_HOST = process.env.MSSQL_HOST || 'localhost';
  protected MSSQL_PORT = parseInt(process.env.MSSQL_PORT || '1434');
  protected readonly MSSQL_USER = process.env.MSSQL_USER || 'sa';
  protected readonly MSSQL_PASSWORD = process.env.MSSQL_PASSWORD || 'HomeCare2025';

  private testContainer: StartedTestContainer | null = null;

  /**
   * Prepara la BD de test: inicia el contenedor, crea BD nueva y ejecuta migraciones.
   * La base de datos de test siempre se levanta en un contenedor.
   */
  async setupDatabase(): Promise<void> {
    console.log(`[TEST] Creando base de datos de test: ${this.testDbName}`);
    console.log(`[TEST] Configuración de conexión inicial: ${this.MSSQL_HOST}:${this.MSSQL_PORT}`);


    // INICIO DEL CONTENEDOR (YA NO ES CONDICIONAL)
    console.log('[TEST] Iniciando contenedor de SQL Server para tests...');

    const image = process.env.MSSQL_IMAGE || 'mcr.microsoft.com/mssql/server:2019-latest';

    const container = await new GenericContainer(image)
      .withEnvironment({ ACCEPT_EULA: 'Y', SA_PASSWORD: this.MSSQL_PASSWORD })
      .withExposedPorts(1433)
      .start();

    this.testContainer = container;

    const host = container.getHost();
    const port = container.getMappedPort(1433);

    // Reemplazar los valores de conexión con los del contenedor dinámico
    this.MSSQL_HOST = host;
    this.MSSQL_PORT = port;

    console.log(`[TEST] Contenedor iniciado en ${host}:${port}`);

    // Esperar a que SQL Server acepte conexiones (reintentos)
    await this.waitForSqlServer(host, port, this.MSSQL_USER, this.MSSQL_PASSWORD);
    console.log('[TEST] Contenedor SQL Server listo');
    // FIN DEL CONTENEDOR


    // 1. Conectar a master para crear la BD
    const masterConnection = new sql.ConnectionPool({
      server: this.MSSQL_HOST, // Usando la propiedad actualizada del contenedor
      port: this.MSSQL_PORT,   // Usando la propiedad actualizada del contenedor
      user: this.MSSQL_USER,
      password: this.MSSQL_PASSWORD,
      database: 'master',
      authentication: {
        type: 'default',
      },
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    await masterConnection.connect();
    await masterConnection.request().query(`CREATE DATABASE ${this.testDbName}`);
    await masterConnection.close();
    console.log(`[TEST] ✓ Base de datos ${this.testDbName} creada`);

    // 2. Conectar a la BD de test
    this.dbConnection = new sql.ConnectionPool({
      server: this.MSSQL_HOST, 
      port: this.MSSQL_PORT,   
      user: this.MSSQL_USER,
      password: this.MSSQL_PASSWORD,
      database: this.testDbName,
      authentication: {
        type: 'default',
      },
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    await this.dbConnection.connect();
    console.log(`[TEST] ✓ Conectado a BD de test`);

    // 3. Ejecutar migraciones
    await this.runMigrations();
  }

  /**
   * Inicializa la aplicación Nest
   */
  async setupApplication(): Promise<void> {
    console.log('[TEST] Inicializando aplicación Nest...');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();
    console.log('[TEST] ✓ Aplicación Nest inicializada');
  }

  /**
   * Limpia recursos (BD, app)
   */
  async teardown(): Promise<void> {
    console.log('[TEST] Limpiando recursos...');

    if (this.app) {
      await this.app.close();
    }

    if (this.dbConnection) {
      await this.dbConnection.close();
    }

    // Eliminar BD de test
    const masterConnection = new sql.ConnectionPool({
      server: this.MSSQL_HOST, // Usando el host/puerto del contenedor
      port: this.MSSQL_PORT,   // Usando el host/puerto del contenedor
      user: this.MSSQL_USER,
      password: this.MSSQL_PASSWORD,
      database: 'master',
      authentication: {
        type: 'default',
      },
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    try {
      await masterConnection.connect();
      // Asegurar que no haya conexiones activas a la BD antes de eliminarla
      await masterConnection.request().query(`ALTER DATABASE ${this.testDbName} SET SINGLE_USER WITH ROLLBACK IMMEDIATE;`);
      await masterConnection.request().query(`DROP DATABASE IF EXISTS ${this.testDbName}`);
      await masterConnection.close();
      console.log(`[TEST] ✓ BD de test eliminada`);
    } catch (error) {
      console.error(`[TEST] Error al eliminar BD: ${error}`);
    }

    // Detener contenedor si fue levantado
    if (this.testContainer) {
      try {
        console.log('[TEST] Deteniendo contenedor de test...');
        await this.testContainer.stop();
        console.log('[TEST] ✓ Contenedor detenido');
      } catch (err) {
        console.warn('[TEST] Error al detener contenedor:', err);
      }
    }
  }

  /**
   * Ejecuta una query contra la BD de test
   */
  async executeQuery(query: string, params?: Record<string, any>): Promise<any> {
    const request = this.dbConnection.request();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    return request.query(query);
  }

  /**
   * Limpia datos de una tabla
   */
  async cleanTable(tableName: string): Promise<void> {
    await this.executeQuery(`DELETE FROM ${tableName}`);
  }

  /**
   * Limpia todas las tablas
   */
  async cleanAllTables(): Promise<void> {
    await this.cleanTable('workers');
  }

  // ============ MÉTODOS PRIVADOS ============

  private async runMigrations(): Promise<void> {
    const { MigrationRunner } = await import('../../src/database/migrationRunner');
    const migrationRunner = new MigrationRunner(this.dbConnection);
    await migrationRunner.runMigrations();
    console.log('[TEST] ✓ Migraciones ejecutadas');
  }

  private async waitForSqlServer(host: string, port: number, user: string, password: string): Promise<void> {
    const maxRetries = 30;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const pool = new sql.ConnectionPool({
          server: host,
          port,
          user,
          password,
          database: 'master',
          authentication: { type: 'default' },
          options: { encrypt: true, trustServerCertificate: true },
          connectionTimeout: 5000,
        });

        await pool.connect();
        await pool.close();
        return;
      } catch (err) {
        console.log(`[TEST] Waiting for SQL Server (${attempt}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, delayMs));
      }
    }

    throw new Error('SQL Server in testcontainer did not become ready in time');
  }
}