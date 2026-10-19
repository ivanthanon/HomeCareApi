export interface ForLoggingCommandFailures {
  log(commandName: string, error: Error): void;
}