import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export async function testDatabaseConnection(): Promise<void> {
  try {
    const res = await pool.query('SELECT NOW()');
    logger.info(`DB Connected: ${res.rows[0].now}`);
  } catch (error) {
    logger.error('DB Connection Failed', error);
    throw error;
  }
}