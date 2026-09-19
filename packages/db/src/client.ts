import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load .env from multiple potential directory depths
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString =
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  '';

export const pool = new Pool({
  connectionString,
  ssl: connectionString ? {
    rejectUnauthorized: false, // Required for hosted Supabase PostgreSQL
  } : undefined,
});

export const db = drizzle(pool, { schema });
