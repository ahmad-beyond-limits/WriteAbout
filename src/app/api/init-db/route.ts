import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. Create practices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS practices (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        text TEXT NOT NULL,
        rate VARCHAR(50) NOT NULL,
        feedback TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create api_calls table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_calls (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return NextResponse.json({ message: 'Database initialized successfully!' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: 'Failed to initialize database.' }, { status: 500 });
  }
}
