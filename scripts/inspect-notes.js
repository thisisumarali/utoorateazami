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

async function run() {
  const res = await pool.query('SELECT id, name, description, pyramid FROM products ORDER BY id');
  
  console.log(`Total products: ${res.rows.length}`);
  let hasNotesInDesc = 0;
  let hasNonEmptyPyramid = 0;

  for (const p of res.rows) {
    const desc = p.description || '';
    const pyr = typeof p.pyramid === 'string' ? JSON.parse(p.pyramid || '{}') : (p.pyramid || {});
    const pyrHasData = Boolean(pyr.top || pyr.heart || pyr.base);

    if (pyrHasData) {
      hasNonEmptyPyramid++;
      console.log(`[HAS PYRAMID IN DB] ${p.id} (${p.name}):`, JSON.stringify(pyr));
    } else if (desc.toLowerCase().includes('top') || desc.toLowerCase().includes('heart') || desc.toLowerCase().includes('middle') || desc.toLowerCase().includes('base') || desc.toLowerCase().includes('notes')) {
      hasNotesInDesc++;
      console.log(`[DESC CONTAINS NOTE KEYWORDS] ${p.id} (${p.name}):`);
      console.log('   ', desc.slice(0, 200));
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Products with non-empty pyramid in DB: ${hasNonEmptyPyramid}`);
  console.log(`Products with note keywords in description: ${hasNotesInDesc}`);

  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
