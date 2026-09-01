import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateSalt, hashPassword } from '@/lib/crypto';

// Helper to verify admin permissions
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

    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        COALESCE(u.role, 'user') AS role,
        u.created_at,
        (u.api_key IS NOT NULL AND u.api_key != '') AS has_api_key,
        COALESCE(t_count.count, 0) AS typing_tests_count,
        COALESCE(p_count.count, 0) AS practices_count,
        GREATEST(t_count.latest, p_count.latest, u.created_at) AS last_active
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as count, MAX(created_at) as latest
        FROM tests
        GROUP BY user_id
      ) t_count ON u.id = t_count.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as count, MAX(created_at) as latest
        FROM practices
        GROUP BY user_id
      ) p_count ON u.id = p_count.user_id
      ORDER BY u.id ASC;
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      users: result.rows.map((r) => ({
        id: r.id,
        username: r.username,
        email: r.email || null,
        role: r.role,
        createdAt: r.created_at,
        hasApiKey: Boolean(r.has_api_key),
        typingTestsCount: parseInt(r.typing_tests_count, 10) || 0,
        practicesCount: parseInt(r.practices_count, 10) || 0,
        lastActive: r.last_active
      }))
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Administrator access required.' }, { status: 403 });
    }

    const data = await request.json();
    const { username, password, email, role } = data;

    if (!username || !password || !username.trim() || !password.trim()) {
      return NextResponse.json({ success: false, error: 'Username and password are required.' }, { status: 400 });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const userRole = role === 'admin' ? 'admin' : 'user';

    // Check duplicate
    const check = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [trimmedUsername]);
    if (check.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Username already exists.' }, { status: 400 });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const insertResult = await pool.query(
      'INSERT INTO users (username, password_hash, salt, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, created_at',
      [trimmedUsername, passwordHash, salt, email?.trim() || null, userRole]
    );

    const newUser = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at,
        hasApiKey: false,
        typingTestsCount: 0,
        practicesCount: 0
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user via admin:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user.' }, { status: 500 });
  }
}
