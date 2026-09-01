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

const defaultNeonUrl = 'postgresql://neondb_owner:npg_G4EzBcyub0nX@ep-morning-mud-ateojs9y-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || defaultNeonUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });
