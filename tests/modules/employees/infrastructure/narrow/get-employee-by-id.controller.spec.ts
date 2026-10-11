import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeEach, describe, it, vi } from 'vitest';
import { GetEmployeeByIdQueryHandler } from 'src/modules/employees/application/get-employee-by-id/getEmployeeByIdQueryHandler';
import { EmployeesController } from 'src/modules/employees/infrastructure/restapi/create-employee/employee.controller';
import { CreateEmployeeCommandHandler } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';

describe('EmployeesController GET /employees/:id request contract', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: CreateEmployeeCommandHandler,
          useValue: { execute: vi.fn() },
        },
        {
          provide: GetEmployeeByIdQueryHandler,
          useValue: { execute: vi.fn() },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should reject an ID that is not a GUID with 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .get('/employees/not-a-guid')
      .expect(400)
      .expect({
        error: 'Bad Request',
        message: 'Employee id must be a valid guid',
        statusCode: 400,
      });
  });
});
