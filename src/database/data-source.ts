import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const isTruthy = (value: string | undefined, defaultValue = false): boolean => {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes', 'on', 'require', 'required'].includes(value.trim().toLowerCase());
};

const useSsl = isTruthy(process.env.DB_SSL, false);
const rejectUnauthorized = isTruthy(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST?.trim() ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME?.trim() ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME?.trim() ?? 'crm_backend',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  ssl: useSsl ? { rejectUnauthorized } : false,
});
