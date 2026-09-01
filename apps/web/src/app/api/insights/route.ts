import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'week'; // default to week
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // 1. Clean temporary old API telemetry logs (older than 30 days)
    await pool.query(`DELETE FROM api_calls WHERE created_at < NOW() - INTERVAL '30 days'`);

    // 2. Fetch API Usage Data (strictly 7 days)
    const apiUsageResult = await pool.query(`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '6 days'), 
          date_trunc('day', NOW()), 
          '1 day'::interval
        ) AS day
      )
      SELECT 
        to_char(days.day, 'Mon DD') AS name,
        COUNT(a.id) AS calls
      FROM days
      LEFT JOIN api_calls a ON date_trunc('day', a.created_at) = days.day AND a.user_id = $1
      GROUP BY days.day
      ORDER BY days.day;
    `, [userId]);

    // 3. Fetch Performance Breakdown (Group by rate)
    const performanceResult = await pool.query(`
      SELECT rate AS name, COUNT(*) AS value
      FROM practices
      WHERE (
        CASE 
          WHEN $2 = 'month' THEN created_at >= NOW() - INTERVAL '1 month'
          ELSE created_at >= NOW() - INTERVAL '7 days'
        END
      ) AND user_id = $1
      GROUP BY rate;
    `, [userId, filter]);

    // Ensure all rates are present for the Bar Chart
    const rates = ['low', 'medium', 'good', 'high', 'excellent'];
    const performanceData = rates.map(rate => {
      const found = performanceResult.rows.find((r: any) => r.name === rate);
      return { name: rate, value: found ? parseInt(found.value) : 0 };
    });

    // 4. Fetch Recent Practices (History List)
    const historyResult = await pool.query(`
      SELECT id, rate, feedback, image_url, text, to_char(created_at, 'Mon DD, YYYY') as date
      FROM practices
      WHERE (
        CASE 
          WHEN $2 = 'month' THEN created_at >= NOW() - INTERVAL '1 month'
          ELSE created_at >= NOW() - INTERVAL '7 days'
        END
      ) AND user_id = $1
      ORDER BY created_at DESC
      LIMIT 30;
    `, [userId, filter]);

    return NextResponse.json({
      success: true,
      apiUsage: apiUsageResult.rows,
      performance: performanceData,
      history: historyResult.rows
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch insights' }, { status: 500 });
  }
}
