import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DeleteEmployeeController } from 'src/modules/employees/infrastructure/restapi/delete-employee/employee.controller';
import { DeleteEmployeeCommandHandler } from 'src/modules/employees/application/delete-employee/deleteEmployeeCommandHandler';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('DeleteEmployeeController', () => {
    let app: INestApplication;
    let deleteEmployeeCommandHandler: DeleteEmployeeCommandHandler;
    let mockExecute: Mock;

    const path = '/employees';

    beforeEach(async () => {
        mockExecute = vi.fn();
        const mockDeleteEmployeeUseCase = {
            execute: mockExecute,
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [DeleteEmployeeController],
            providers: [
                {
                    provide: DeleteEmployeeCommandHandler,
                    useValue: mockDeleteEmployeeUseCase,
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        deleteEmployeeCommandHandler = app.get<DeleteEmployeeCommandHandler>(DeleteEmployeeCommandHandler);
    });

    describe('When the employee does not exist', () => {
        it('should return a 404 Not Found', async () => {
            deleteEmployeeCommandHandler.execute = vi.fn().mockResolvedValue({ success: false, error: new Error('Employee not found') });

            const response = await request(app.getHttpServer())
                .delete(`${path}/550e8400-e29b-41d4-a716-446655440000`)
                .expect(404);

            expect(response.body).toEqual({
                error: 'Not Found',
                message: 'Employee not found',
                statusCode: 404,
            });
        });
    });

    describe('When the employee is deleted', () => {
        it('should return a 204 No Content', async () => {
            deleteEmployeeCommandHandler.execute = vi.fn().mockResolvedValue({ success: true });

            await request(app.getHttpServer())
                .delete(`${path}/550e8400-e29b-41d4-a716-446655440000`)
                .expect(204);
        });
    });

    describe('When the id is not a valid guid', () => {
        it('should return a 400 Bad Request', async () => {
            deleteEmployeeCommandHandler.execute = vi.fn().mockResolvedValue({ success: true });

            const response = await request(app.getHttpServer())
                .delete(`${path}/not-a-guid`)
                .expect(400);

            expect(response.body).toEqual({
                error: 'Bad Request',
                message: 'Employee id must be a valid guid',
                statusCode: 400,
            });
        });
    });
});
