const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim().replace(/^['"](.*)['"]$/, '$1');
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/utoorateazami',
});

async function fix() {
  console.log('Syncing database sequences...');
  try {
    await pool.query("SELECT setval(pg_get_serial_sequence('utoor_orders', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM utoor_orders;");
    console.log('✓ utoor_orders sequence synced.');
  } catch (e) {
    console.warn('utoor_orders sequence warning:', e.message);
  }

  try {
    await pool.query("SELECT setval(pg_get_serial_sequence('utoor_coupons', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM utoor_coupons;");
    console.log('✓ utoor_coupons sequence synced.');
  } catch (e) {
    console.warn('utoor_coupons sequence warning:', e.message);
  }

  await pool.end();
  console.log('Done.');
}

fix().catch(console.error);
