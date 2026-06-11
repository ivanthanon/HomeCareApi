import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WorkersController } from './api/controllers/workers.controller';
import { CreateWorkerCommandHandler } from './app/commands/createworker/createWorkerCommandHandler';
import { CreateWorkerCommand } from './app/commands/createworker/createWorkerCommand';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('WorkersController', () => {
  let app: INestApplication;
  let createWorkerCommandHandler: CreateWorkerCommandHandler;
  let mockExecute: Mock;

  beforeEach(async () => {
    mockExecute = vi.fn();
    const mockCreateWorkerUseCase = {
      execute: mockExecute,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WorkersController],
      providers: [
        {
          provide: CreateWorkerCommandHandler, 
          useValue: mockCreateWorkerUseCase,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    createWorkerCommandHandler = app.get<CreateWorkerCommandHandler>(CreateWorkerCommandHandler);
  });

  describe('createWorker', () => {
    it('should create a command and call CreateWorkerUseCase.execute', async () => {
      const createWorkerRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'John',
        lastName: 'Doe',
        documentNumber: '12345678',
        dateOfBirth: '1990-01-01',
      };
      mockExecute.mockResolvedValue({
        id: createWorkerRequest.id,
      });

      await request(app.getHttpServer())
        .post('/workers')
        .send(createWorkerRequest)
        .expect(201);

      const expectedCommand = new CreateWorkerCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'John',
        'Doe',
        '12345678',
        '1990-01-01',
      );
      expect(createWorkerCommandHandler.execute).toHaveBeenCalledWith(expectedCommand);
    });
  });
});
