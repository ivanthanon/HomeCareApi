import { Controller, Post, Body, HttpCode } from '@nestjs/common';

interface CreateWorkerRequest {
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: string;
}

@Controller('workers')
export class WorkersController {
  @Post()
  @HttpCode(201)
  async createWorker(@Body() createWorkerRequest: CreateWorkerRequest) {
    throw new Error('CreateWorkerUseCase not implemented');
  }
}
