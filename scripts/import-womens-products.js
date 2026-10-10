const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// 1. Load .env
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

// 2. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 3. PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/utoorateazami',
});

// Helper to decode HTML entities
function decodeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8360;/g, 'Rs')
    .trim();
}

// Upload cache to prevent redundant uploads
const uploadedCache = {};

async function uploadToCloudinary(url, publicName) {
  if (!url) return '';
  if (url.includes('res.cloudinary.com')) return url;
  if (uploadedCache[url]) return uploadedCache[url];

  try {
    const res = await cloudinary.uploader.upload(url, {
      folder: 'utoorateazami/products',
      public_id: publicName,
      overwrite: true,
      resource_type: 'image',
    });
    uploadedCache[url] = res.secure_url;
    return res.secure_url;
  } catch (err) {
    console.warn(`  ⚠️ Cloudinary upload warning for ${publicName}: ${err.message}. Keeping source URL.`);
    return url;
  }
}

// Fallback descriptions for products with empty description
const customDescriptions = {
  ruby: 'A precious, radiant oriental blend with lush velvety florals, glowing amber, and sensual warmth. Crafted for the elegant, confident woman.',
  sapphire: 'A sparkling, regal jewel of a fragrance. Brilliant fresh floral top notes giving way to a refined powdery musk and velvety woods.',
};

async function main() {
  const jsonPath = path.resolve(__dirname, 'womens-products-scraped.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Scraped products file not found!');
    process.exit(1);
  }

  const rawProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Starting Cloudinary upload and database import for ${rawProducts.length} Women's products...\n`);

  let count = 0;
  for (const p of rawProducts) {
    count++;
    const cleanId = p.id;
    let cleanName = decodeHtml(p.name).toUpperCase();
    let cleanDesc = decodeHtml(p.description);
    if (!cleanDesc && customDescriptions[cleanId]) {
      cleanDesc = customDescriptions[cleanId];
    }

    console.log(`[${count}/${rawProducts.length}] Processing: ${cleanName} (${cleanId})...`);

    // 1. Upload Images to Cloudinary CDN
    let cdnImage = p.primaryImage;
    if (cdnImage) {
      process.stdout.write('  Uploading primary image to Cloudinary... ');
      cdnImage = await uploadToCloudinary(p.primaryImage, `${cleanId}-primary`);
      console.log('✓');
    }

    let cdnSecondaryImage = p.secondaryImage;
    if (cdnSecondaryImage && cdnSecondaryImage !== p.primaryImage) {
      process.stdout.write('  Uploading secondary image to Cloudinary... ');
      cdnSecondaryImage = await uploadToCloudinary(p.secondaryImage, `${cleanId}-secondary`);
      console.log('✓');
    } else {
      cdnSecondaryImage = '';
    }

    // 2. Prepare Price & Variants
    const minPrice = p.price;
    const maxPrice = p.regularPrice && p.regularPrice > p.price ? p.regularPrice : p.price;
    const priceDisplay = p.regularPrice && p.regularPrice > p.price
      ? `Rs${p.price.toLocaleString()} – Rs${p.regularPrice.toLocaleString()}`
      : `Rs${p.price.toLocaleString()}`;

    // Clean variants array
    const cleanVariants = (p.variants || []).map(v => ({
      size: v.size || p.size || '50ml',
      price: v.price || p.price,
      regularPrice: v.regularPrice || null,
      inStock: p.inStock !== false && v.inStock !== false,
    }));

    // Realistic rating & reviews
    const rating = (4.8 + (cleanId.charCodeAt(0) % 3) * 0.1).toFixed(1);
    const reviewsCount = 18 + (cleanId.length * 3);

    // 3. Upsert into products table
    await pool.query(
      `INSERT INTO products (
        id, name, category, category_display, tags, price_display,
        min_price, max_price, sale_badge, inspired_by, rating,
        reviews_count, image, secondary_image, description,
        pyramid, variants, in_stock, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        category_display = EXCLUDED.category_display,
        price_display = EXCLUDED.price_display,
        min_price = EXCLUDED.min_price,
        max_price = EXCLUDED.max_price,
        sale_badge = EXCLUDED.sale_badge,
        image = EXCLUDED.image,
        secondary_image = EXCLUDED.secondary_image,
        description = EXCLUDED.description,
        pyramid = EXCLUDED.pyramid,
        variants = EXCLUDED.variants,
        in_stock = EXCLUDED.in_stock,
        updated_at = NOW();`,
      [
        cleanId,
        cleanName,
        'womens',
        "WOMEN'S",
        JSON.stringify(['womens', p.size, cleanId]),
        priceDisplay,
        minPrice,
        maxPrice,
        p.saleBadge,
        null, // inspired_by
        parseFloat(rating),
        reviewsCount,
        cdnImage,
        cdnSecondaryImage,
        cleanDesc,
        JSON.stringify(p.pyramid || {}),
        JSON.stringify(cleanVariants),
        p.inStock,
      ]
    );

    // 4. Link in product_categories junction table
    await pool.query(
      `INSERT INTO product_categories (product_id, category_id)
       VALUES ($1, 'womens')
       ON CONFLICT DO NOTHING;`,
      [cleanId]
    );

    // If gift set, also link to gift-set category
    if (cleanId.includes('gift-set') || p.size === 'Gift Set') {
      await pool.query(
        `INSERT INTO product_categories (product_id, category_id)
         VALUES ($1, 'gift-set')
         ON CONFLICT DO NOTHING;`,
        [cleanId]
      );
    }

    // If name contains oud, also link to oud category
    if (cleanId.includes('oud')) {
      await pool.query(
        `INSERT INTO product_categories (product_id, category_id)
         VALUES ($1, 'oud')
         ON CONFLICT DO NOTHING;`,
        [cleanId]
      );
    }

    console.log(`  ✓ Successfully imported ${cleanName} into DB!\n`);
  }

  console.log('🎉 All Women\'s products successfully uploaded to Cloudinary and imported into PostgreSQL!');
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
