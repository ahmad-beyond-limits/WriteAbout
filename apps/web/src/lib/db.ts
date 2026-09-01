import { Pool } from 'pg';

// Create a single pool instance to be shared across requests
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false, // Required for many hosted postgres like Neon
  },
});

export default pool;
