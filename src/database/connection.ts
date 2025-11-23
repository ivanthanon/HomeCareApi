import sql from 'mssql';
import { dbConfig } from './config';

export const pool = new sql.ConnectionPool(dbConfig);

export const connectToDatabase = async (): Promise<void> => {
  try {
    await pool.connect();
    console.log('Connected to MSSQL database');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};
