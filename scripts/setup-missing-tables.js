const { Pool } = require('pg');

async function setup(url, name) {
  const p = new Pool({ connectionString: url, ssl: false });
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS utoor_activity_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        admin_email VARCHAR(255) DEFAULT 'salman@utoorate.com',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await p.query(`
      CREATE TABLE IF NOT EXISTS utoor_contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        topic VARCHAR(100) DEFAULT 'General Question',
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Unread',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log(`✓ Tables created on ${name}`);
  } catch (e) {
    console.error(`Error on ${name}:`, e.message);
  } finally {
    await p.end();
  }
}

async function run() {
  await setup('postgresql://postgres:root@localhost:5432/utoorateazami', 'Local DB');
  await setup('postgresql://postgres:utooratedb123@169.58.205.65:15432/postgres', 'Coolify DB');
}

run();
