const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:root@localhost:5432/utoorateazami',
  });
  const p1 = await pool.query("SELECT id, name, price_display FROM products WHERE price_display ILIKE '%From%'");
  console.log('local products with From:', p1.rows.length);
  for (const x of p1.rows.slice(0, 10)) {
    console.log(x);
  }
  await pool.end();
}

run().catch(console.error);
