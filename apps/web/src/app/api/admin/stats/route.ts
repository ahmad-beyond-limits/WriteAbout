import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function verifyAdmin(request: Request): Promise<boolean> {
  const adminIdHeader = request.headers.get('x-admin-id');
  const adminUsernameHeader = request.headers.get('x-admin-username');

  if (!adminIdHeader && !adminUsernameHeader) return false;

  const res = await pool.query(
    'SELECT id, role, username FROM users WHERE (id = $1 OR LOWER(username) = LOWER($2)) AND role = $3',
    [adminIdHeader ? parseInt(adminIdHeader, 10) : 0, adminUsernameHeader || '', 'admin']
  );

  return res.rows.length > 0;
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Administrator access required.' }, { status: 403 });
    }

    const [userRes, testRes, practiceRes, adminRes] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count, AVG(wpm) as avg_wpm FROM tests'),
      pool.query('SELECT COUNT(*) as count FROM practices'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: parseInt(userRes.rows[0]?.count, 10) || 0,
        totalAdmins: parseInt(adminRes.rows[0]?.count, 10) || 0,
        totalTypingTests: parseInt(testRes.rows[0]?.count, 10) || 0,
        averageWpm: Math.round(parseFloat(testRes.rows[0]?.avg_wpm) || 0),
        totalPractices: parseInt(practiceRes.rows[0]?.count, 10) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats.' }, { status: 500 });
  }
}
