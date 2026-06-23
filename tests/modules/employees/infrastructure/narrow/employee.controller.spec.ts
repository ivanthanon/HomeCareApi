import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EmployeesController } from 'src/modules/employees/infrastructure/restapi/create-employee/employee.controller';
import { CreateEmployeeCommandHandler, CreateEmployeeCommand } from 'src/modules/employees/application/create-employee/createEmployeeCommandHandler';
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

    describe('When employee has a empty name', () => {
        it('should not create a employee', async () => {
            const createEmployeeRequest = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                firstName: '',
                lastName: 'Doe',
                documentNumber: '12345678',
                dateOfBirth: '1990-01-01',
            };
            createEmployeeCommandHandler.execute = vi.fn().mockResolvedValue({ success: false, error: new Error() });

            const response = await request(app.getHttpServer())
                .post(path)
                .send(createEmployeeRequest)
                .expect(400);

            expect(response.body).toMatchObject({
                "error": "Bad Request",
                "message": "Employee name must not be empty",
                "statusCode": 400,
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
                dateOfBirth: '1990-01-01',
            };
            createEmployeeCommandHandler.execute = vi.fn().mockResolvedValue({ success: false, error: new Error() });

            const response = await request(app.getHttpServer())
                .post(path)
                .send(createEmployeeRequest)
                .expect(400);

            expect(response.body).toMatchObject({
                "error": "Bad Request",
                "message": "Employee name must not be empty",
                "statusCode": 400,
            });
        });
    });
});