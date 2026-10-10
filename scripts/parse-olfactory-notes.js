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

function parseNotesFromText(desc) {
  if (!desc) return null;

  // Pattern: NOTES TOP : ... MIDDLE/HEART : ... BASE : ...
  const m1 = desc.match(/NOTES\s+TOP\s*:\s*([^:]+?)\s*(?:MIDDLE|HEART)\s*:\s*([^:]+?)\s*BASE\s*:\s*([^.]+?)(?:\s+Concentrated|\s+EDP|\s+\d+\s*ml|$)/i);
  if (m1) {
    return {
      top: m1[1].trim().replace(/,\s*$/, ''),
      heart: m1[2].trim().replace(/,\s*$/, ''),
      base: m1[3].trim().replace(/,\s*$/, ''),
    };
  }

  // Pattern: Top notes: ... Heart/Middle notes: ... Base notes: ...
  const m2 = desc.match(/Top\s*notes?\s*:\s*([^.]+?)\.?(?:\s+Heart|\s+Middle)\s*notes?\s*:\s*([^.]+?)\.?\s+Base\s*notes?\s*:\s*([^.]+?)(?:\.|$)/i);
  if (m2) {
    return {
      top: m2[1].trim(),
      heart: m2[2].trim(),
      base: m2[3].trim(),
    };
  }

  return null;
}

async function run() {
  const res = await pool.query('SELECT id, name, description, pyramid FROM products');
  let extracted = 0;

  for (const p of res.rows) {
    const desc = p.description || '';
    const parsed = parseNotesFromText(desc);

    if (parsed) {
      console.log(`✓ Extracted notes for ${p.id} (${p.name}):`, parsed);
      await pool.query('UPDATE products SET pyramid = $1 WHERE id = $2', [JSON.stringify(parsed), p.id]);
      extracted++;
    }
  }

  console.log(`\nExtracted notes for ${extracted} products from descriptions.`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
