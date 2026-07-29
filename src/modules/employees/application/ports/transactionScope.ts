
export interface TransactionScope {
  execute<T>(work: () => Promise<T>): Promise<T>;
}
