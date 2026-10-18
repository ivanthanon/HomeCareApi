import { Result } from 'src/modules/employees/domain/shared/result';

export interface CommandHandler<Command, Value> {
  execute(command: Command): Promise<Result<Value, Error>>;
}