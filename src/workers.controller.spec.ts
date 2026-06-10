import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkersController } from './api/controllers/workers.controller';
import { CreateWorkerCommandHandler } from './app/commands/createworker/createWorkerCommandHandler';
import { CreateWorkerCommand } from './app/commands/createworker/createWorkerCommand';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('WorkersController', () => {
  let workersController: WorkersController;
  let createWorkerCommandHandler: CreateWorkerCommandHandler;
  let mockExecute: Mock;

  beforeEach(async () => {
    mockExecute = vi.fn();
    const mockCreateWorkerUseCase = {
      execute: mockExecute,
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [WorkersController],
      providers: [
        {
          provide: CreateWorkerCommandHandler, 
          useValue: mockCreateWorkerUseCase,
        },
      ],
    }).compile();

    workersController = app.get<WorkersController>(WorkersController);
    createWorkerCommandHandler = app.get<CreateWorkerCommandHandler>(CreateWorkerCommandHandler);
  });

  describe('createWorker', () => {
    it('should create a command and call CreateWorkerUseCase.execute', async () => {
      const createWorkerRequest = {
        firstName: 'John',
        lastName: 'Doe',
        documentNumber: '12345678',
        dateOfBirth: '1990-01-01',
      };
      mockExecute.mockResolvedValue({
        id: '1',
      });

      await workersController.createWorker(createWorkerRequest);

      const expectedCommand = new CreateWorkerCommand(
        'John',
        'Doe',
        '12345678',
        '1990-01-01',
      );
      expect(createWorkerCommandHandler.execute).toHaveBeenCalledWith(expectedCommand);
    });
  });
});
