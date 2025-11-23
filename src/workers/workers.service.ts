import { Injectable } from '@nestjs/common';
import { pool } from '../database/connection';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { Worker } from './entities/worker.entity';

@Injectable()
export class WorkersService {
  async create(createWorkerDto: CreateWorkerDto): Promise<Worker> {
    const request = pool.request();
    
    const result = await request
      .input('firstName', createWorkerDto.firstName)
      .input('lastName', createWorkerDto.lastName)
      .input('documentNumber', createWorkerDto.documentNumber)
      .input('dateOfBirth', createWorkerDto.dateOfBirth)
      .query(`
        INSERT INTO workers (first_name, last_name, document_number, date_of_birth)
        OUTPUT INSERTED.*
        VALUES (@firstName, @lastName, @documentNumber, @dateOfBirth)
      `);

    const workerRow = result.recordset[0];
    return {
      id: workerRow.id,
      firstName: workerRow.first_name,
      lastName: workerRow.last_name,
      documentNumber: workerRow.document_number,
      dateOfBirth: workerRow.date_of_birth,
      createdAt: workerRow.created_at,
      updatedAt: workerRow.updated_at,
    };
  }

  async findAll(): Promise<Worker[]> {
    const request = pool.request();
    const result = await request.query('SELECT * FROM workers');

    return result.recordset.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      documentNumber: row.document_number,
      dateOfBirth: row.date_of_birth,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findOne(id: string): Promise<Worker | null> {
    const request = pool.request();
    const result = await request
      .input('id', id)
      .query('SELECT * FROM workers WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }

    const row = result.recordset[0];
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      documentNumber: row.document_number,
      dateOfBirth: row.date_of_birth,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
