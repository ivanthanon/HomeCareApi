import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EmployeesController } from 'src/modules/employees/infrastructure/restapi/create-employee/employee.controller';
import {
  CreateEmployeeCommandHandler,
  CreateEmployeeCommand,
} from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
import request from 'supertest';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
  Mock,
} from 'vitest';
import { GetEmployeeByIdQueryHandler } from 'src/modules/employees/application/get-employee-by-id/getEmployeeByIdQueryHandler';

describe('EmployeesController', () => {
  let app: INestApplication;
  let createEmployeeCommandHandler: CreateEmployeeCommandHandler;
  let mockExecute: Mock;
  let getEmployeeQueryHandlerExecute: Mock;

  const path = '/employees';

  beforeAll(async () => {
    mockExecute = vi.fn();
    getEmployeeQueryHandlerExecute = vi.fn();
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
        {
          provide: GetEmployeeByIdQueryHandler,
          useValue: { execute: getEmployeeQueryHandlerExecute },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    createEmployeeCommandHandler = app.get<CreateEmployeeCommandHandler>(
      CreateEmployeeCommandHandler,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    getEmployeeQueryHandlerExecute.mockReset();
  });

  describe('When employee has a empty name', () => {
    it('should not create a employee', async () => {
      const createEmployeeRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: '',
        lastName: 'Doe',
        documentNumber: '12345678',
        dateOfBirth: '1990-01-01T00:00:00Z',
      };
      createEmployeeCommandHandler.execute = vi
        .fn()
        .mockResolvedValue({ success: false, error: new Error() });

      const response = await request(app.getHttpServer())
        .post(path)
        .send(createEmployeeRequest)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Employee name must not be empty',
        statusCode: 400,
      });
    });
  });

  describe('When employee has a empty lastName', () => {
    it('should not create a employee', async () => {
      const createEmployeeRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'Juanito',
        lastName: '',
        documentNumber: '12345678',
        dateOfBirth: '1990-01-01T00:00:00Z',
      };
      createEmployeeCommandHandler.execute = vi
        .fn()
        .mockResolvedValue({ success: false, error: new Error() });

      const response = await request(app.getHttpServer())
        .post(path)
        .send(createEmployeeRequest)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Employee lastname must not be empty',
        statusCode: 400,
      });
    });
  });

  describe('When employee has a invalid id', () => {
    it('should not create a employee', async () => {
      const createEmployeeRequest = {
        id: 'pepito',
        firstName: 'Juan',
        lastName: 'Doe',
        documentNumber: '12345678',
        dateOfBirth: '1990-01-01T00:00:00Z',
      };
      createEmployeeCommandHandler.execute = vi
        .fn()
        .mockResolvedValue({ success: false, error: new Error() });

      const response = await request(app.getHttpServer())
        .post(path)
        .send(createEmployeeRequest)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Employee id must be a valid guid',
        statusCode: 400,
      });
    });
  });

  describe('When employee has a empty documentNumber', () => {
    it('should not create a employee', async () => {
      const createEmployeeRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'Juan',
        lastName: 'Doe',
        documentNumber: '',
        dateOfBirth: '1990-01-01T00:00:00Z',
      };
      createEmployeeCommandHandler.execute = vi
        .fn()
        .mockResolvedValue({ success: false, error: new Error() });

      const response = await request(app.getHttpServer())
        .post(path)
        .send(createEmployeeRequest)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Employee document number must not be empty',
        statusCode: 400,
      });
    });
  });

  describe('When employee has a invalid date', () => {
    it('should not create a employee', async () => {
      const createEmployeeRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'Juan',
        lastName: 'Doe',
        documentNumber: '44444444X',
        dateOfBirth: 'errorDate',
      };
      createEmployeeCommandHandler.execute = vi
        .fn()
        .mockResolvedValue({ success: false, error: new Error() });

      const response = await request(app.getHttpServer())
        .post(path)
        .send(createEmployeeRequest)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Employee date of birth number must be a valid date',
        statusCode: 400,
      });
    });
  });

  describe('When getting an employee by ID', () => {
    it('should return 400 when the ID is not a GUID', async () => {
      const response = await request(app.getHttpServer())
        .get(`${path}/not-a-guid`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Employee id must be a valid guid',
        statusCode: 400,
      });
    });

    it('should return 500 with the unexpected error message', async () => {
      getEmployeeQueryHandlerExecute.mockResolvedValue({
        success: false,
        error: new Error('Database connection failed'),
      });

      const response = await request(app.getHttpServer())
        .get(`${path}/550e8400-e29b-41d4-a716-446655440000`)
        .expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Database connection failed',
        error: 'Internal Server Error',
      });
    });
  });
});
