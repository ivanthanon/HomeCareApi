import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString: any = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '1433', 10),
  database: process.env.DB_NAME || 'HomeCare',
  user: process.env.DB_USER || 'HomeCareUser',
  password: process.env.DB_PASSWORD || 'Homecare@2025',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export { connectionString };
