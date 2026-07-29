import { AsyncLocalStorage } from 'node:async_hooks';
import { ConnectionPool, Request, Transaction as MssqlTransaction } from 'mssql';
import { TransactionScope } from 'src/modules/employees/application/ports/transactionScope';

const transactionStorage = new AsyncLocalStorage<MssqlTransaction>();

export class SqlServerTransactionScope implements TransactionScope {

  constructor(private readonly pool: ConnectionPool) {}

  async execute<T>(work: () => Promise<T>): Promise<T> {
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

  getRequest(): Request {
    const tx = transactionStorage.getStore();
    return (tx ?? this.pool).request();
  }
}
