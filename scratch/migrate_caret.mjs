import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_G4EzBcyub0nX@ep-morning-mud-ateojs9y-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_settings'"
    );
    console.log('Columns in user_settings:', cols.rows);

    // Alter smooth_caret to varchar(50) if needed
    await pool.query(`
      ALTER TABLE user_settings 
      ALTER COLUMN smooth_caret TYPE VARCHAR(50) 
      USING (CASE WHEN smooth_caret = true THEN 'slow' ELSE 'off' END);
    `);
    await pool.query(`
      ALTER TABLE user_settings 
      ALTER COLUMN smooth_caret SET DEFAULT 'slow';
    `);
    console.log('Altered smooth_caret to VARCHAR(50) with default slow');
  } catch (e) {
    console.error('Migration error:', e);
  } finally {
    await pool.end();
  }
}

main();
