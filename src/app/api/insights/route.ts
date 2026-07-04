import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'week'; // default to week

    // 1. Sweep Clean (Data Retention Logic)
    // Delete practices older than 1 month
    await pool.query(`DELETE FROM practices WHERE created_at < NOW() - INTERVAL '1 month'`);
    // Delete API calls older than 1 week
    await pool.query(`DELETE FROM api_calls WHERE created_at < NOW() - INTERVAL '1 week'`);

    // 2. Fetch API Usage Data
    const daysInterval = filter === 'month' ? 29 : 6;
    const apiUsageResult = await pool.query(`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '${daysInterval} days'), 
          date_trunc('day', NOW()), 
          '1 day'::interval
        ) AS day
      )
      SELECT 
        to_char(days.day, 'Mon DD') AS name,
        COUNT(a.id) AS calls
      FROM days
      LEFT JOIN api_calls a ON date_trunc('day', a.created_at) = days.day
      GROUP BY days.day
      ORDER BY days.day;
    `);

    // 3. Fetch Performance Breakdown (Group by rate)
    const intervalStr = filter === 'month' ? '1 month' : '1 week';
    const performanceResult = await pool.query(`
      SELECT rate AS name, COUNT(*) AS value
      FROM practices
      WHERE created_at >= NOW() - INTERVAL '${intervalStr}'
      GROUP BY rate;
    `);

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
      WHERE created_at >= NOW() - INTERVAL '${intervalStr}'
      ORDER BY created_at DESC
      LIMIT 20;
    `);

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
