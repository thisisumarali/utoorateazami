const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:utooratedb123@169.58.205.65:15432/postgres',
  ssl: false,
});

async function run() {
  const res = await pool.query(`
    SELECT id, name, price_display, min_price, max_price, variants
    FROM products
  `);

  const issues = [];
  for (const r of res.rows) {
    let variants = r.variants;
    if (typeof variants === 'string') {
      try { variants = JSON.parse(variants); } catch (e) { variants = []; }
    }
    const prices = (Array.isArray(variants) ? variants : []).map(v => parseFloat(v.price) || 0).filter(p => p > 0);
    const min = prices.length > 0 ? Math.min(...prices) : parseFloat(r.min_price) || 0;
    const max = prices.length > 0 ? Math.max(...prices) : parseFloat(r.max_price) || 0;

    const pd = r.price_display || '';
    if (pd.toLowerCase().includes('from') || (min !== max && !pd.includes('–') && !pd.includes('-'))) {
      issues.push({ id: r.id, name: r.name, price_display: pd, min, max, variantsCount: prices.length });
    }
  }

  console.log('Total products with price_display not showing range when min != max:', issues.length);
  for (const it of issues.slice(0, 15)) {
    console.log(it.id, '|', it.name, '| pd:', JSON.stringify(it.price_display), '| min:', it.min, '| max:', it.max, '| variants:', it.variantsCount);
  }

  await pool.end();
}

run().catch(console.error);
