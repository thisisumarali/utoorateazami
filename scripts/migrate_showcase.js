const { Pool } = require('pg');

async function migrate(dbUrl, label) {
  try {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('.supabase.') || dbUrl.includes('.neon.') || dbUrl.includes('ssl=true') ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
    });
    console.log(`Connecting to ${label}...`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS utoor_showcase_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'home_spotlight',
        title VARCHAR(255) NOT NULL DEFAULT 'AZAMIS SPECIAL',
        subtitle VARCHAR(255) DEFAULT '',
        product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const initialIds = JSON.stringify([
      'shamekh-gift-set',
      'baccarat-rouge',
      'janan',
      'oud-al-azami',
      'silver-oud',
      'rakaan',
      'aventus-creed',
      'wisaal-oud'
    ]);

    await pool.query(`
      INSERT INTO utoor_showcase_settings (id, title, subtitle, product_ids)
      VALUES ('home_spotlight', 'AZAMIS SPECIAL', '', $1::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `, [initialIds]);

    const check = await pool.query(`SELECT * FROM utoor_showcase_settings WHERE id = 'home_spotlight'`);
    console.log(`Success on ${label}:`, check.rows[0]);
    await pool.end();
  } catch (err) {
    console.error(`Error on ${label}:`, err.message);
  }
}

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Error: DATABASE_URL is not set.");
    return;
  }
  await migrate(dbUrl, 'Live Database');
}

run();
