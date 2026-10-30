const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    value = value.trim().replace(/^['"](.*)['"]$/, '$1');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  const c = await client.query("SELECT count(*) FROM categories WHERE image LIKE '%wp%' OR banner_image LIKE '%wp%'");
  console.log('Categories with WP:', c.rows[0].count);
  const p = await client.query("SELECT count(*) FROM products WHERE image LIKE '%wp%' OR secondary_image LIKE '%wp%'");
  console.log('Products with WP:', p.rows[0].count);
  const o = await client.query("SELECT count(*) FROM utoor_orders WHERE items::text LIKE '%wp%'");
  console.log('Orders with WP:', o.rows[0].count);

  const comingSoonCheck = await client.query("SELECT count(*) FROM products WHERE image LIKE '%coming-soon%'");
  console.log('Products with coming-soon image:', comingSoonCheck.rows[0].count);

  console.log('\n--- VERIFYING CATEGORIES ---');
  const cats = await client.query("SELECT id, name, image, banner_image FROM categories ORDER BY sort_order");
  console.table(cats.rows);

  await client.end();
}

run().catch(console.error);
