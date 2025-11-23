import sql from 'mssql';
import { connectionString } from './config';

export const pool = new sql.ConnectionPool(connectionString);

export const connectToDatabase = async (): Promise<void> => {
  try {
    await pool.connect();
    console.log('Connected to MSSQL database');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};
