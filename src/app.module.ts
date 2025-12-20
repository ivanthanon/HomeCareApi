import { Module } from '@nestjs/common';
import { WorkersController } from './api/workers.controller';

@Module({
  controllers: [WorkersController]
})

export class AppModule {}
