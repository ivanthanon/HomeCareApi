export interface ForLogging {
  log(commandName: string, error: Error): void;
}