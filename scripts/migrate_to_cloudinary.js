const { Client } = require('pg');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Read .env manually in case process.env is not yet loaded
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
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
}

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const config = cloudinary.config();
const isConfigured = Boolean(
  (config.cloud_name && config.api_key && config.api_secret) ||
  process.env.CLOUDINARY_URL
);

async function run() {
  if (!isConfigured) {
    console.error('❌ Cloudinary is not configured yet.');
    console.error('Please add the following to your .env file:');
    console.error('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.error('  CLOUDINARY_API_KEY=your_api_key');
    console.error('  CLOUDINARY_API_SECRET=your_api_secret');
    process.exit(1);
  }

  console.log(`☁️ Cloudinary configured for cloud: "${config.cloud_name}"`);
  console.log('📦 Connecting to PostgreSQL database...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/utoorateazami',
  });
  await client.connect();

  console.log('🔍 Finding all images in products and categories...');

  const prodImgs = await client.query(`
    SELECT DISTINCT image FROM products WHERE image IS NOT NULL AND image != ''
    UNION
    SELECT DISTINCT secondary_image FROM products WHERE secondary_image IS NOT NULL AND secondary_image != '';
  `);

  const catImgs = await client.query(`
    SELECT DISTINCT image FROM categories WHERE image IS NOT NULL AND image != ''
    UNION
    SELECT DISTINCT banner_image FROM categories WHERE banner_image IS NOT NULL AND banner_image != '';
  `);

  const allUrls = Array.from(new Set([
    ...prodImgs.rows.map(r => r.image),
    ...catImgs.rows.map(r => r.image),
  ])).filter(url => url && !url.includes('res.cloudinary.com'));

  console.log(`Found ${allUrls.length} external image(s) to migrate to Cloudinary.`);

  const urlMap = {};

  for (let i = 0; i < allUrls.length; i++) {
    const oldUrl = allUrls[i];
    console.log(`[${i + 1}/${allUrls.length}] Uploading to Cloudinary: ${oldUrl}`);
    try {
      const uploadRes = await cloudinary.uploader.upload(oldUrl, {
        folder: 'utoorateazami',
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
      });
      urlMap[oldUrl] = uploadRes.secure_url;
      console.log(`   -> Uploaded: ${uploadRes.secure_url}`);
    } catch (err) {
      console.error(`   ❌ Failed to upload ${oldUrl}:`, err.message);
    }
  }

  console.log('🔄 Updating database records with new Cloudinary URLs...');

  let productsUpdated = 0;
  let categoriesUpdated = 0;

  for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
    const p1 = await client.query('UPDATE products SET image = $1 WHERE image = $2', [newUrl, oldUrl]);
    const p2 = await client.query('UPDATE products SET secondary_image = $1 WHERE secondary_image = $2', [newUrl, oldUrl]);
    productsUpdated += (p1.rowCount || 0) + (p2.rowCount || 0);

    const c1 = await client.query('UPDATE categories SET image = $1 WHERE image = $2', [newUrl, oldUrl]);
    const c2 = await client.query('UPDATE categories SET banner_image = $1 WHERE banner_image = $2', [newUrl, oldUrl]);
    categoriesUpdated += (c1.rowCount || 0) + (c2.rowCount || 0);
  }

  console.log('✅ Migration Complete!');
  console.log(`   - Images uploaded: ${Object.keys(urlMap).length}`);
  console.log(`   - Products updated: ${productsUpdated}`);
  console.log(`   - Categories updated: ${categoriesUpdated}`);

  await client.end();
}

run().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
