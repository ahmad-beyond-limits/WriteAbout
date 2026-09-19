import { Pool } from 'pg';

const connectionString =
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  '';

// Create a single pool instance to be shared across requests
const pool = new Pool({
  connectionString,
  ssl: connectionString ? {
    rejectUnauthorized: false, // Required for hosted Supabase PostgreSQL
  } : undefined,
});

export default pool;
