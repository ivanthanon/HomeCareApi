import { AsyncLocalStorage } from 'node:async_hooks';
import { ConnectionPool, Transaction as MssqlTransaction } from 'mssql';
import { UnitOfWork } from 'src/modules/employees/domain/shared/unitofwork';


const transactionStorage = new AsyncLocalStorage<MssqlTransaction>();

export class SqlServerUnitOfWork implements UnitOfWork {

  constructor(private readonly pool: ConnectionPool) {}

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    const transaction = new MssqlTransaction(this.pool);
    await transaction.begin();

    try {
      const result = await transactionStorage.run(transaction, work);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static getCurrentTransaction(): MssqlTransaction | undefined {
    return transactionStorage.getStore();
  }
}
