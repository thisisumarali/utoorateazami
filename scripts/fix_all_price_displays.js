const { Pool } = require('pg');

async function fixDb(connectionString, label) {
  const pool = new Pool({ connectionString, ssl: false });
  try {
    console.log(`Connecting to ${label}...`);
    const res = await pool.query('SELECT id, name, price_display, min_price, max_price, variants FROM products');
    console.log(`Found ${res.rows.length} products in ${label}`);

    let updated = 0;
    for (const r of res.rows) {
      let variants = r.variants;
      if (typeof variants === 'string') {
        try { variants = JSON.parse(variants); } catch (e) { variants = []; }
      }
      const prices = (Array.isArray(variants) ? variants : [])
        .map(v => parseFloat(v.price) || 0)
        .filter(p => p > 0);

      let min = prices.length > 0 ? Math.min(...prices) : parseFloat(r.min_price) || 0;
      let max = prices.length > 0 ? Math.max(...prices) : parseFloat(r.max_price) || 0;

      if (min === 0 && max === 0) {
        min = 500;
        max = 2000;
      } else if (max === 0) {
        max = min;
      }

      const cleanRange = min === max
        ? `Rs${min.toLocaleString()}`
        : `Rs${min.toLocaleString()} – Rs${max.toLocaleString()}`;

      const current = (r.price_display || '').trim();

      // If current has 'From' or doesn't have range when min != max or is null
      if (
        !current ||
        current.toLowerCase().includes('from') ||
        (min !== max && !current.includes('–') && !current.includes('-')) ||
        current !== cleanRange
      ) {
        await pool.query(
          'UPDATE products SET price_display = $1, min_price = $2, max_price = $3, updated_at = NOW() WHERE id = $4',
          [cleanRange, min, max, r.id]
        );
        updated++;
      }
    }
    console.log(`Updated ${updated} products in ${label} to clean ranges!`);
  } catch (err) {
    console.error(`Error fixing ${label}:`, err.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  if (process.env.DATABASE_URL) {
    await fixDb(process.env.DATABASE_URL, 'Database');
  }
}

main();
