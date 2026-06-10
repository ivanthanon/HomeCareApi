import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { CreateWorkerCommandHandler, CreateWorkerRequest } from '../../app/commands/createworker/createWorkerCommandHandler';
import { CreateWorkerCommand } from '../../app/commands/createworker/createWorkerCommand';

@Controller('workers')
export class WorkersController {
  constructor(
    private readonly createWorkerCommandHandler: CreateWorkerCommandHandler,
  ) {}

  @Post()
  @HttpCode(201)
  async createWorker(@Body() createWorkerRequest: CreateWorkerRequest) {
    const command = new CreateWorkerCommand(
      createWorkerRequest.firstName,
      createWorkerRequest.lastName,
      createWorkerRequest.documentNumber,
      createWorkerRequest.dateOfBirth,
    );

    return await this.createWorkerCommandHandler.execute(command);
  }
}
