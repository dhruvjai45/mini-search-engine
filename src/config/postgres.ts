import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export async function testDatabaseConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('DB Connected:', res.rows[0].now);
    client.release();
  } catch (error) {
    console.error('DB Connection Failed:', error);
    throw error;
  }
}