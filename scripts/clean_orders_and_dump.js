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
  const res = await client.query("SELECT id, order_number, items FROM utoor_orders WHERE items::text LIKE '%utoorateazami.com%'");
  console.log('Orders with WP images:', res.rows.length);
  for (const o of res.rows) {
    let itemsStr = JSON.stringify(o.items);
    itemsStr = itemsStr.replace(/https:\/\/utoorateazami\.com\/wp-content\/uploads\/[0-9]{4}\/[0-9]{2}\/[^"]+/g, 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214125/utoorateazami/ozfcbywexyyi9mpbbrm7.jpg');
    await client.query('UPDATE utoor_orders SET items = $1::jsonb WHERE id = $2', [itemsStr, o.id]);
    console.log('Cleaned order in DB:', o.order_number);
  }

  // Also clean dump sql file
  const dumpPath = path.resolve(__dirname, '..', 'coolify_database_dump.sql');
  if (fs.existsSync(dumpPath)) {
    let dump = fs.readFileSync(dumpPath, 'utf8');
    dump = dump.replace(/https:\/\/utoorateazami\.com\/wp-content\/uploads\/[0-9]{4}\/[0-9]{2}\/[^"'\s)]+\.(?:png|jpg|jpeg|webp)/g, 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214125/utoorateazami/ozfcbywexyyi9mpbbrm7.jpg');
    fs.writeFileSync(dumpPath, dump, 'utf8');
    console.log('Cleaned coolify_database_dump.sql');
  }

  await client.end();
}

run().catch(console.error);
