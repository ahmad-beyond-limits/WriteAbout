import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const connectionString =
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';

const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined
});

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    // 1. Add role, email, first_name & last_name columns to users table
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
    `);
    console.log('Columns added/verified.');

    // 2. Check if admin user exists
    const adminUser = 'muhammad ahmad';
    const adminPass = 'AHMAD12345678#MA';
    const salt = generateSalt();
    const passwordHash = hashPassword(adminPass, salt);

    const existing = await pool.query('SELECT id, username, role FROM users WHERE LOWER(username) = LOWER($1)', [adminUser]);
    if (existing.rows.length > 0) {
      console.log('Updating existing admin user:', existing.rows[0]);
      await pool.query(
        'UPDATE users SET password_hash = $1, salt = $2, role = $3, first_name = $4, last_name = $5 WHERE id = $6',
        [passwordHash, salt, 'admin', 'Muhammad', 'Ahmad', existing.rows[0].id]
      );
      console.log('Admin user updated successfully.');
    } else {
      console.log('Inserting new admin user...');
      const insert = await pool.query(
        'INSERT INTO users (username, password_hash, salt, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role, first_name, last_name',
        [adminUser, passwordHash, salt, 'admin', 'Muhammad', 'Ahmad']
      );
      console.log('Admin user created successfully:', insert.rows[0]);
    }

    const allUsers = await pool.query('SELECT id, username, role, created_at FROM users');
    console.log('All users in DB:', allUsers.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
