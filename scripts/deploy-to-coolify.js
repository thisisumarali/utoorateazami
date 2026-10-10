const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. Get Coolify target connection string from CLI argument or COOLIFY_DATABASE_URL env
const targetUrl = process.argv[2] || process.env.COOLIFY_DATABASE_URL;

if (!targetUrl) {
  console.error('\n[ERROR] Missing Coolify PostgreSQL connection string.');
  console.log('\nUsage:');
  console.log('  node scripts/deploy-to-coolify.js "postgresql://postgres:PASSWORD@YOUR_VPS_IP:5432/utoorateazami"');
  console.log('\nOr set COOLIFY_DATABASE_URL in your .env file.\n');
  process.exit(1);
}

async function deploy() {
  console.log('\n======================================================');
  console.log('DEPLOYING UTOORAT E AZAMI DATABASE TO COOLIFY VPS');
  console.log('======================================================');

  // Parse connection URL
  let parsed;
  try {
    parsed = new URL(targetUrl);
    console.log(`Target Host: ${parsed.hostname}`);
    console.log(`Target Port: ${parsed.port || 5432}`);
    console.log(`Target Database: ${parsed.pathname.replace('/', '')}`);
    console.log(`Target User: ${parsed.username}`);
  } catch (e) {
    console.error('Invalid database URL format:', e.message);
    process.exit(1);
  }

  const dumpPath = path.resolve(__dirname, '..', 'coolify_database_dump.sql');
  if (!fs.existsSync(dumpPath)) {
    console.error('coolify_database_dump.sql not found! Generating now...');
    require('./export-coolify-dump');
  }

  const sqlDump = fs.readFileSync(dumpPath, 'utf8');

  // 1. Try to connect to target database
  let targetPool = new Pool({
    connectionString: targetUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('\nConnecting to Coolify PostgreSQL...');
    await targetPool.query('SELECT 1');
    console.log('✓ Successfully connected to target database!');
  } catch (err) {
    // If database does not exist, try to connect to 'postgres' DB and create it
    if (err.code === '3D000') {
      const dbName = parsed.pathname.replace('/', '');
      console.log(`Database "${dbName}" does not exist yet. Attempting to create it via default "postgres" db...`);
      const adminUrl = new URL(targetUrl);
      adminUrl.pathname = '/postgres';
      const adminPool = new Pool({ connectionString: adminUrl.toString() });
      await adminPool.query(`CREATE DATABASE "${dbName}";`);
      await adminPool.end();
      console.log(`✓ Database "${dbName}" created successfully!`);
    } else {
      console.error('\n[CONNECTION ERROR]', err.message);
      if (err.message.includes('password') || err.code === '28P01') {
        console.error('Hint: Check your PostgreSQL password in Coolify.');
      } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
        console.error('Hint: In Coolify PostgreSQL service settings, ensure "Make it public" is ENABLED or port 5432 is exposed so you can connect from outside.');
      }
      process.exit(1);
    }
  }

  // 2. Execute SQL Dump
  console.log('\nExecuting SQL schema and importing data into Coolify...');
  try {
    await targetPool.query(sqlDump);
    console.log('✓ SQL Dump executed successfully!');
  } catch (err) {
    console.error('Error executing SQL dump:', err.message);
    process.exit(1);
  }

  // 3. Verify counts on Coolify
  console.log('\n--- VERIFYING DATA ON COOLIFY VPS ---');
  try {
    const pCount = await targetPool.query('SELECT count(*) FROM products');
    const cCount = await targetPool.query('SELECT count(*) FROM categories');
    const pcCount = await targetPool.query('SELECT count(*) FROM product_categories');
    const oCount = await targetPool.query('SELECT count(*) FROM utoor_orders');

    console.table([
      { Table: 'products', 'Count on Coolify': pCount.rows[0].count },
      { Table: 'categories', 'Count on Coolify': cCount.rows[0].count },
      { Table: 'product_categories', 'Count on Coolify': pcCount.rows[0].count },
      { Table: 'utoor_orders', 'Count on Coolify': oCount.rows[0].count },
    ]);

    console.log('\n======================================================');
    console.log('DEPLOYMENT COMPLETE!');
    console.log('Now update your production .env on Coolify/Vercel with:');
    console.log(`DATABASE_URL="${targetUrl}"`);
    console.log('======================================================\n');
  } catch (e) {
    console.warn('Verification warning:', e.message);
  }

  await targetPool.end();
  process.exit(0);
}

deploy().catch(e => {
  console.error(e);
  process.exit(1);
});
