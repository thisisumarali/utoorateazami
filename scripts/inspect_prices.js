const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:utooratedb123@169.58.205.65:15432/postgres',
  ssl: false,
});

async function run() {
  const res = await pool.query('SELECT id, name, price_display, min_price, max_price FROM products LIMIT 25');
  for (const r of res.rows) {
    console.log(r.id, '|', r.name, '| price_display:', JSON.stringify(r.price_display), '| min:', r.min_price, '| max:', r.max_price);
  }
  await pool.end();
}

run().catch(console.error);
