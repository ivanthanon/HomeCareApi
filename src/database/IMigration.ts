import { Request } from 'mssql';

export interface IMigration {
  up: (request: Request) => Promise<void>;
  down: (request: Request) => Promise<void>;
}
