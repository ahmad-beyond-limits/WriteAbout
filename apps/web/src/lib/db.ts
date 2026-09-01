import { Pool } from 'pg';

const defaultNeonUrl =
  'postgresql://neondb_owner:npg_G4EzBcyub0nX@ep-morning-mud-ateojs9y-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  defaultNeonUrl;

// Create a single pool instance to be shared across requests
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for hosted postgres like Neon
  },
});

export default pool;
