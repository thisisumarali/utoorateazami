const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
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
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  await client.connect();
  console.log('--- ALL CATEGORIES ---');
  const cats = await client.query('SELECT id, name, title, image, banner_image, sort_order FROM categories ORDER BY sort_order');
  console.log(cats.rows);

  console.log('\n--- COMING SOON PRODUCTS ---');
  const prodsWithComing = await client.query("SELECT id, name, category, image, secondary_image, created_at, updated_at FROM products WHERE image LIKE '%coming-soon%' OR secondary_image LIKE '%coming-soon%'");
  console.log(prodsWithComing.rows);

  console.log('\n--- PRODUCTS WITH WP ---');
  const prodsWithWp = await client.query("SELECT id, name, image, secondary_image FROM products WHERE image LIKE '%wp%' OR secondary_image LIKE '%wp%'");
  console.log(prodsWithWp.rows);

  await client.end();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
