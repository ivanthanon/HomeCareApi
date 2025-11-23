export interface IMigration {
  up: (request: any) => Promise<void>;
  down: (request: any) => Promise<void>;
}
