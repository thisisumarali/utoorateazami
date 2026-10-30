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
  const res = await client.query(`
    SELECT id, name, category, image, secondary_image, in_stock, is_hidden 
    FROM products 
    WHERE name ILIKE '%floreta%' OR name ILIKE '%isman%' OR name ILIKE '%boom%' OR name ILIKE '%motia%'
  `);
  console.log('Found matching products:');
  console.log(res.rows);
  await client.end();
}

run().catch(console.error);
