import { Module } from '@nestjs/common';
import { WorkersController } from './api/controllers/workers.controller';
import { CreateWorkerCommandHandler } from './app/commands/createworker/createWorkerCommandHandler';

@Module({
  controllers: [WorkersController],
  providers: [CreateWorkerCommandHandler],
})
export class AppModule {}
