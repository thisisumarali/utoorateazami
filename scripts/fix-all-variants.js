const https = require('https');
const { Pool } = require('pg');
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
      let value = (match[2] || '').trim().replace(/^['"](.*)['"]$/, '$1');
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/utoorateazami',
});

const slugAliases = {
  'aventus-creed': 'creed-aventus',
  'ward-e-taif': 'ward-al-taif',
  'dior-sauvage': 'sauvage',
};

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', () => resolve({ status: 500, data: '' }));
  });
}

function sortVariants(vList) {
  const order = { '3ml': 1, '6ml': 2, '12ml': 3, '15ml': 4, '25ml': 5, '30ml': 6, '50ml': 7, '60ml': 8, '75ml': 9, '90ml': 10, '100ml': 11 };
  return vList.sort((a, b) => {
    const oa = order[a.size.toLowerCase()] || 99;
    const ob = order[b.size.toLowerCase()] || 99;
    return oa - ob;
  });
}

async function fixAllProductVariants() {
  console.log('Fetching all products from database...');
  const res = await pool.query('SELECT id, name, price_display, min_price, max_price, in_stock, description, variants FROM products ORDER BY id');
  const products = res.rows;
  console.log(`Found ${products.length} products to process.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const rawSlug = slugAliases[p.id] || p.id;
    process.stdout.write(`[${i + 1}/${products.length}] ${p.name} (${p.id})... `);

    const pageRes = await fetchUrl(`https://utoorateazami.com/?product=${rawSlug}`);
    if (pageRes.status !== 200) {
      console.log(`⚠️ Failed to fetch page (${pageRes.status})`);
      skippedCount++;
      continue;
    }

    const html = pageRes.data;
    const match = html.match(/data-product_variations="([^"]+)"/i);

    if (match) {
      const raw = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      try {
        const variations = JSON.parse(raw);
        if (Array.isArray(variations) && variations.length > 0) {
          const parsedVariants = [];

          for (const v of variations) {
            let sizeVal = '3ml';
            if (v.attributes) {
              const keys = Object.keys(v.attributes);
              for (const k of keys) {
                if (v.attributes[k]) {
                  sizeVal = v.attributes[k];
                  break;
                }
              }
            }

            const price = parseFloat(v.display_price) || 0;
            const regularPrice = parseFloat(v.display_regular_price) || price;
            const inStock = Boolean(v.is_in_stock);

            parsedVariants.push({
              size: sizeVal,
              price: price,
              regularPrice: regularPrice,
              inStock: inStock,
            });
          }

          const sorted = sortVariants(parsedVariants);
          const prices = sorted.map(v => v.price).filter(pr => pr > 0);
          const minPrice = prices.length > 0 ? Math.min(...prices) : (parseFloat(p.min_price) || 500);
          const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice;
          const overallInStock = sorted.some(v => v.inStock);
          const priceDisplay = minPrice === maxPrice ? `Rs${minPrice}` : `From Rs${minPrice}`;

          await pool.query(
            `UPDATE products 
             SET variants = $1, min_price = $2, max_price = $3, in_stock = $4, price_display = $5, updated_at = NOW() 
             WHERE id = $6`,
            [JSON.stringify(sorted), minPrice, maxPrice, overallInStock, priceDisplay, p.id]
          );

          console.log(`✓ Updated ${sorted.length} variants (min=Rs${minPrice}, max=Rs${maxPrice}, in_stock=${overallInStock})`);
          updatedCount++;
          continue;
        }
      } catch (err) {
        console.log(`⚠️ JSON parse error: ${err.message}`);
      }
    }

    // Single product fallback
    console.log(`ℹ️ Single-variant item`);
    skippedCount++;
  }

  console.log('\n======================================================');
  console.log(`ALL VARIANTS UPDATED!`);
  console.log(`Updated products: ${updatedCount}`);
  console.log(`Single-variant products kept: ${skippedCount}`);
  console.log('======================================================\n');

  await pool.end();
}

fixAllProductVariants().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
