import fs from 'fs';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, '../../config/database.json');

const rawConfig = fs.readFileSync(configPath, 'utf-8');
const allConfigs = JSON.parse(rawConfig);

const connectionString: string = allConfigs[env];

if (!connectionString) {
  throw new Error(`Database configuration for environment "${env}" not found`);
}

export { connectionString };
