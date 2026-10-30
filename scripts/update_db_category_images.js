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

const categoryUpdates = {
  'mens': {
    image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214150/utoorateazami/fbztgsjrb8waxskodrrw.jpg',
    banner_image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214150/utoorateazami/fbztgsjrb8waxskodrrw.jpg',
  },
  'oud': {
    image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214109/utoorateazami/yyl7ugkseajb4su7tdks.jpg',
    banner_image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214109/utoorateazami/yyl7ugkseajb4su7tdks.jpg',
  },
  'unisex': {
    image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214117/utoorateazami/g0sxbs1smxleqrtimjtm.jpg',
    banner_image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214148/utoorateazami/klca1a35cqgolxf7fxcd.jpg',
  },
  'gift-set': {
    image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214130/utoorateazami/d737dde3zfxxhpnkdeoa.png',
    banner_image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214130/utoorateazami/d737dde3zfxxhpnkdeoa.png',
  },
  'womens': {
    image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214140/utoorateazami/lloogqmg8fpn3fyahdzs.jpg',
    banner_image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214148/utoorateazami/klca1a35cqgolxf7fxcd.jpg',
  },
  'azamis-special': {
    image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214133/utoorateazami/f1ewuk9jii6ixb3h1gsa.jpg',
    banner_image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214133/utoorateazami/f1ewuk9jii6ixb3h1gsa.jpg',
  },
  'best-seller': {
    image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214146/utoorateazami/aolnsv4n3am5ahyx0xrl.jpg',
    banner_image: 'https://res.cloudinary.com/oelbtnhb/image/upload/v1791214146/utoorateazami/aolnsv4n3am5ahyx0xrl.jpg',
  },
};

async function run() {
  await client.connect();
  console.log('Updating categories in PostgreSQL...');
  for (const [id, data] of Object.entries(categoryUpdates)) {
    const res = await client.query(
      'UPDATE categories SET image = $1, banner_image = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, image, banner_image;',
      [data.image, data.banner_image, id]
    );
    if (res.rows.length > 0) {
      console.log(`Updated category [${id}]:`, res.rows[0]);
    } else {
      console.warn(`Category [${id}] not found to update!`);
    }
  }

  const check = await client.query('SELECT id, name, image, banner_image FROM categories ORDER BY sort_order');
  console.log('\nUpdated Categories:');
  console.table(check.rows);

  await client.end();
}

run().catch(console.error);
