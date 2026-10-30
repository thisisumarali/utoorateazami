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
  const res = await client.query('SELECT id, name, image, secondary_image FROM products');
  console.log(`Analyzing ${res.rows.length} products...`);
  
  const issues = [];
  for (const p of res.rows) {
    const img = p.image || '';
    const sec = p.secondary_image || '';
    
    if (img.includes('utoorateazami.com') || sec.includes('utoorateazami.com')) {
      issues.push({ id: p.id, name: p.name, reason: 'contains utoorateazami.com domain (WP)', img, sec });
    } else if (!img) {
      issues.push({ id: p.id, name: p.name, reason: 'missing primary image', img, sec });
    }
  }

  console.log(`Found ${issues.length} product image issues:`);
  console.table(issues);

  await client.end();
}

run().catch(console.error);
