const { Pool } = require('pg');

async function test() {
  const coolify = new Pool({
    connectionString: 'postgresql://postgres:utooratedb123@169.58.205.65:15432/postgres',
    ssl: false,
  });
  try {
    const res = await coolify.query('SELECT id, name, min_price, max_price, price_display, variants FROM products WHERE id = $1', ['janan']);
    console.log('COOLIFY DB JANAN:', JSON.stringify(res.rows[0], null, 2));
  } catch(e) {
    console.log('COOLIFY DB ERROR:', e.message);
  } finally {
    await coolify.end();
  }

  const local = new Pool({
    connectionString: 'postgresql://postgres:root@localhost:5432/utoorateazami',
  });
  try {
    const res = await local.query('SELECT id, name, min_price, max_price, price_display, variants FROM products WHERE id = $1', ['janan']);
    console.log('LOCAL DB JANAN:', JSON.stringify(res.rows[0], null, 2));
  } catch(e) {
    console.log('LOCAL DB ERROR:', e.message);
  } finally {
    await local.end();
  }
}

test();
