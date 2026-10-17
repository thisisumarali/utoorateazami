const { Pool } = require('pg');

async function clean(url, name) {
  const p = new Pool({ connectionString: url, ssl: false });
  try {
    await p.query("DELETE FROM utoor_orders WHERE order_number IN ('UA-VERIFY-100', 'UA-TEST-999', 'UA-COOLIFY-TEST-1')");
    console.log(`Cleaned test orders on ${name}`);
  } catch (e) {
    console.error(e.message);
  } finally {
    await p.end();
  }
}

async function run() {
  if (process.env.DATABASE_URL) {
    await clean(process.env.DATABASE_URL, 'Database');
  }
}

run();
