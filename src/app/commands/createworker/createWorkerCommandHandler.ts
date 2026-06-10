import { CreateWorkerCommand } from './createWorkerCommand';

export interface CreateWorkerRequest {
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: string;
}

export interface CreateWorkerResponse {
  id: string;
}

export class CreateWorkerCommandHandler {
  async execute(command: CreateWorkerCommand): Promise<CreateWorkerResponse> {
    throw new Error('Method not implemented.');
  }
}
