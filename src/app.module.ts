import { Module } from '@nestjs/common';
import { WorkersController } from './api/controllers/workers.controller';

@Module({
  controllers: [WorkersController],
  providers: [],
})
export class AppModule {}
