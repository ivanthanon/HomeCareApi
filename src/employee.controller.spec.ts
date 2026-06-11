import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EmployeesController } from './api/controllers/employee.controller';
import { CreateEmployeeCommandHandler, CreateEmployeeCommand} from './app/commands/createEmployee/createEmployeeCommandHandler';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('EmployeesController', () => {
  let app: INestApplication;
  let createEmployeeCommandHandler: CreateEmployeeCommandHandler;
  let mockExecute: Mock;
  const path = '/employees';

  beforeEach(async () => {
    mockExecute = vi.fn();
    const mockCreateEmployeeUseCase = {
      execute: mockExecute,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: CreateEmployeeCommandHandler, 
          useValue: mockCreateEmployeeUseCase,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    createEmployeeCommandHandler = app.get<CreateEmployeeCommandHandler>(CreateEmployeeCommandHandler);
  });

  describe('createEmployee', () => {
    it('should create a command and call CreateEmployeeUseCase.execute', async () => {
      const createEmployeeRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'John',
        lastName: 'Doe',
        documentNumber: '12345678',
        dateOfBirth: '1990-01-01',
      };
      mockExecute.mockResolvedValue({
        id: createEmployeeRequest.id,
      });

      await request(app.getHttpServer())
        .post(path)
        .send(createEmployeeRequest)
        .expect(201);

      const expectedCommand = new CreateEmployeeCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'John',
        'Doe',
        '12345678',
        '1990-01-01',
      );
      expect(createEmployeeCommandHandler.execute).toHaveBeenCalledWith(expectedCommand);
    });
  });
});
