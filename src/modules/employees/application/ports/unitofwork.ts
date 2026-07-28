
export interface UnitOfWork {
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
