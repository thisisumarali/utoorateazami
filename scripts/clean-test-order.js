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
  await clean('postgresql://postgres:root@localhost:5432/utoorateazami', 'Local DB');
  await clean('postgresql://postgres:utooratedb123@169.58.205.65:15432/postgres', 'Coolify DB');
}

run();
