const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim() : 'postgresql://postgres:root@localhost:5432/utoorateazami';

const pool = new Pool({ connectionString: dbUrl });

const SEED_CATEGORIES = [
  // --- Gender Classifications ---
  {
    id: 'men',
    name: 'Men',
    title: 'Masculine, Bold & Regal Fragrances',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png',
    type: 'gender',
    parent_id: null,
  },
  {
    id: 'women',
    name: 'Women',
    title: 'Delicate Florals, Sweet Amber & Royal Jasmine',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/65-2-1024x1024.png',
    type: 'gender',
    parent_id: null,
  },
  {
    id: 'unisex',
    name: 'Unisex',
    title: 'Versatile, Balanced & Universal Essences',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/65-2-1024x1024.png',
    type: 'gender',
    parent_id: null,
  },

  // --- Genre Classifications ---
  {
    id: 'arabic',
    name: 'Arabic',
    title: 'Authentic Oriental Ouds, Amber & Frankincense',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/jood-al-layl-1024x1024.png',
    type: 'genre',
    parent_id: null,
  },
  {
    id: 'french',
    name: 'French',
    title: 'Classic Parisian Floral, Powdery & Chypre Elegance',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/bacratroj-1024x1024.png',
    type: 'genre',
    parent_id: null,
  },
  {
    id: 'western',
    name: 'Western',
    title: 'Modern Fresh Citrus, Crisp Woods & Designer Accords',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/aventus-1024x1024.png',
    type: 'genre',
    parent_id: null,
  },
  {
    id: 'eastern',
    name: 'Eastern',
    title: 'Sacred Woods, Exotic Spices & Traditional Distillates',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/10-1024x1024.png',
    type: 'genre',
    parent_id: null,
  },

  // --- Season Classifications ---
  {
    id: 'winter',
    name: 'Winter',
    title: 'Warm Spices, Rich Resins & Enveloping Sillage for Cold Days',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/jood-al-layl-1024x1024.png',
    type: 'season',
    parent_id: null,
  },
  {
    id: 'summer',
    name: 'Summer',
    title: 'Cooling Citrus, Aquatic Freshness & Airy White Florals',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/5-1024x1024.png',
    type: 'season',
    parent_id: null,
  },
  {
    id: 'spring',
    name: 'Spring',
    title: 'Blooming Wild Petals, Taif Rose & Green Vibrancy',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/12-1024x1024.png',
    type: 'season',
    parent_id: null,
  },
  {
    id: 'autumn',
    name: 'Autumn',
    title: 'Golden Amber, Dry Cedarwood & Sweet Smoky Nuances',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png',
    type: 'season',
    parent_id: null,
  },

  // --- Style Classifications ---
  {
    id: 'long-lasting',
    name: 'Long Lasting',
    title: 'Exceptional 24-Hour Persistence & Lingering Sillage',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/61-1024x1024.png',
    type: 'style',
    parent_id: null,
  },
  {
    id: 'strong',
    name: 'Strong',
    title: 'Intense Room-Filling Projection & Uncompromising Aura',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/jood-al-layl-1024x1024.png',
    type: 'style',
    parent_id: null,
  },
  {
    id: 'office',
    name: 'Office',
    title: 'Subtle, Refined & Sophisticated for Professional Environments',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/11-1024x1024.png',
    type: 'style',
    parent_id: null,
  },
  {
    id: 'signature',
    name: 'Signature',
    title: 'Unforgettable Bespoke Blends That Leave a Lasting Impression',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/bacratroj-1024x1024.png',
    type: 'style',
    parent_id: null,
  },
  {
    id: 'daily-wear',
    name: 'Daily Wear',
    title: 'Comforting, Clean & Effortless Day-to-Day Versatility',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/71-1024x1024.png',
    type: 'style',
    parent_id: null,
  },

  // --- Product Type Classifications ---
  {
    id: 'perfume',
    name: 'Perfume',
    title: 'Artisanal Eau de Parfum & Spray Formulations',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/aventus-1024x1024.png',
    type: 'type',
    parent_id: null,
  },
  {
    id: 'attar',
    name: 'Attar',
    title: '100% Pure Alcohol-Free Concentrated Perfume Oils',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png',
    type: 'type',
    parent_id: null,
  },
  {
    id: 'wax',
    name: 'Wax',
    title: 'Solid Fragrance Balm & Botanical Scented Waxes',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png',
    type: 'type',
    parent_id: null,
  },
  {
    id: 'pocket',
    name: 'Pocket',
    title: 'Portable Pocket Sprays & Rollers for On-the-Go Refreshment',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/5-1024x1024.png',
    type: 'type',
    parent_id: null,
  },

  // --- Store Menu & Collections ---
  {
    id: 'azamis-special',
    name: 'Azamis Special',
    title: 'Handcrafted Connoisseur Private Blends',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png',
    type: 'collection',
    parent_id: null,
  },
  {
    id: 'best-seller',
    name: 'Best Sellers',
    title: 'Most Loved & Highly Commended Customer Favorites',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/11-1024x1024.png',
    type: 'collection',
    parent_id: null,
  },
  {
    id: 'mens',
    name: "Men's Collection",
    title: 'Bold, Woody & Aromatic Fragrances',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png',
    type: 'collection',
    parent_id: null,
  },
  {
    id: 'oud',
    name: 'Oud Collection',
    title: 'Smoky, Sacred & Regal Aged Agarwood',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/09/jood-al-layl-1024x1024.png',
    type: 'collection',
    parent_id: null,
  },
  {
    id: 'gift-set',
    name: 'Gift Sets',
    title: 'Luxury Flacons In Royal Presentation Boxes',
    image: 'https://utoorateazami.com/wp-content/uploads/2024/03/shamekh-gs-min-600x800-1-300x300.png',
    type: 'collection',
    parent_id: null,
  },
];

// Product Category Mappings: Product belongs to multiple classifications simultaneously
const PRODUCT_CATEGORY_MAP = {
  'silver-oud': [
    'men', 'unisex',            // Gender
    'arabic', 'eastern',        // Genre
    'winter', 'autumn',         // Season
    'long-lasting', 'office', 'signature', // Style
    'attar',                    // Product Type
    'mens', 'oud', 'azamis-special' // Collection
  ],
  'janan': [
    'unisex', 'men',
    'western', 'french',
    'spring', 'summer', 'autumn',
    'long-lasting', 'signature', 'daily-wear',
    'attar',
    'azamis-special', 'best-seller'
  ],
  'rakaan': [
    'men',
    'western',
    'summer', 'spring',
    'strong', 'long-lasting', 'daily-wear',
    'attar', 'pocket',
    'mens', 'azamis-special', 'best-seller'
  ],
  'baccarat-rouge': [
    'unisex', 'women',
    'french', 'western',
    'winter', 'autumn', 'spring',
    'long-lasting', 'strong', 'signature',
    'attar',
    'azamis-special', 'best-seller'
  ],
  'oud-al-azami': [
    'men', 'unisex',
    'arabic', 'eastern',
    'winter', 'autumn',
    'strong', 'long-lasting', 'signature',
    'attar',
    'oud', 'mens', 'best-seller'
  ],
  'oud-al-sheikha': [
    'unisex', 'women',
    'arabic', 'french',
    'winter', 'autumn',
    'long-lasting', 'signature',
    'attar',
    'oud', 'mens'
  ],
  'oud-for-greatness': [
    'unisex', 'men',
    'french', 'arabic',
    'winter', 'autumn', 'spring',
    'strong', 'long-lasting', 'signature',
    'attar',
    'oud', 'best-seller'
  ],
  'agar-oud': [
    'men',
    'eastern', 'arabic',
    'winter', 'autumn',
    'strong', 'long-lasting',
    'attar',
    'oud', 'mens'
  ],
  'shamekh-gift-set': [
    'unisex', 'men', 'women',
    'arabic', 'eastern',
    'winter', 'autumn', 'spring',
    'signature', 'long-lasting',
    'attar',
    'gift-set', 'mens', 'azamis-special'
  ],
  'bidun-esam-gift-set': [
    'unisex', 'men', 'women',
    'arabic', 'eastern',
    'winter', 'autumn',
    'signature', 'strong', 'long-lasting',
    'attar',
    'gift-set', 'mens', 'best-seller'
  ],
  'white-oud': [
    'unisex', 'women',
    'western', 'arabic',
    'summer', 'spring',
    'daily-wear', 'office',
    'attar',
    'oud', 'best-seller'
  ],
  'ward-e-taif': [
    'women', 'unisex',
    'arabic', 'eastern',
    'spring', 'summer',
    'long-lasting', 'daily-wear', 'signature',
    'attar',
    'mens'
  ],
  'aventus-creed': [
    'men',
    'french', 'western',
    'summer', 'spring', 'autumn',
    'long-lasting', 'office', 'signature',
    'attar', 'perfume',
    'mens', 'best-seller'
  ],
};

async function migrate() {
  console.log('🚀 Starting migration for many-to-many category system...');

  // 1. Create categories table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      title VARCHAR(255),
      image TEXT,
      type VARCHAR(50) NOT NULL DEFAULT 'collection',
      parent_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✓ Table "categories" created or verified.');

  // 2. Create products table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT 'attar',
      category_display VARCHAR(150),
      tags JSONB DEFAULT '[]'::jsonb,
      price_display VARCHAR(100),
      min_price NUMERIC(10, 2) DEFAULT 0,
      max_price NUMERIC(10, 2) DEFAULT 0,
      sale_badge VARCHAR(50),
      inspired_by VARCHAR(255),
      rating NUMERIC(3, 2) DEFAULT 5.0,
      reviews_count INT DEFAULT 0,
      image TEXT,
      secondary_image TEXT,
      description TEXT,
      pyramid JSONB DEFAULT '{}'::jsonb,
      variants JSONB DEFAULT '[]'::jsonb,
      in_stock BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✓ Table "products" created or verified.');

  // Copy products from utoor_products if utoor_products has data
  await pool.query(`
    INSERT INTO products (
      id, name, category, category_display, tags, price_display,
      min_price, max_price, sale_badge, inspired_by, rating,
      reviews_count, image, secondary_image, description,
      pyramid, variants, in_stock, created_at, updated_at
    )
    SELECT
      id, name, category, category_display, tags, price_display,
      min_price, max_price, sale_badge, inspired_by, rating,
      reviews_count, image, secondary_image, description,
      pyramid, variants, in_stock, created_at, updated_at
    FROM utoor_products
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      category_display = EXCLUDED.category_display,
      tags = EXCLUDED.tags,
      price_display = EXCLUDED.price_display,
      min_price = EXCLUDED.min_price,
      max_price = EXCLUDED.max_price,
      image = EXCLUDED.image,
      secondary_image = EXCLUDED.secondary_image,
      description = EXCLUDED.description,
      pyramid = EXCLUDED.pyramid,
      variants = EXCLUDED.variants,
      in_stock = EXCLUDED.in_stock,
      updated_at = NOW();
  `);
  console.log('✓ Products populated into "products" table.');

  // 3. Create product_categories table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_categories (
      product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (product_id, category_id)
    );
    CREATE INDEX IF NOT EXISTS idx_prod_cat_prod ON product_categories(product_id);
    CREATE INDEX IF NOT EXISTS idx_prod_cat_cat ON product_categories(category_id);
  `);
  console.log('✓ Table "product_categories" created with indices.');

  // 4. Seed categories
  for (const cat of SEED_CATEGORIES) {
    await pool.query(`
      INSERT INTO categories (id, name, title, image, type, parent_id, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        title = EXCLUDED.title,
        image = EXCLUDED.image,
        type = EXCLUDED.type,
        parent_id = EXCLUDED.parent_id,
        updated_at = NOW();
    `, [cat.id, cat.name, cat.title, cat.image, cat.type, cat.parent_id]);
  }
  console.log(`✓ Seeded ${SEED_CATEGORIES.length} categories.`);

  // 5. Seed product_categories mappings
  let relationCount = 0;
  for (const [productId, catIds] of Object.entries(PRODUCT_CATEGORY_MAP)) {
    for (const catId of catIds) {
      await pool.query(`
        INSERT INTO product_categories (product_id, category_id)
        VALUES ($1, $2)
        ON CONFLICT (product_id, category_id) DO NOTHING;
      `, [productId, catId]);
      relationCount++;
    }
  }
  console.log(`✓ Linked ${relationCount} product-category relationships.`);

  // 6. Verification query
  const resCats = await pool.query('SELECT type, COUNT(*) FROM categories GROUP BY type;');
  console.log('Categories by type:', resCats.rows);

  const resProds = await pool.query('SELECT COUNT(*) FROM products;');
  console.log('Total products:', resProds.rows[0].count);

  const resRels = await pool.query('SELECT COUNT(*) FROM product_categories;');
  console.log('Total product_categories links:', resRels.rows[0].count);

  // Sample joined query to test
  const sampleJoin = await pool.query(`
    SELECT p.id, p.name, array_agg(c.name || ' (' || c.type || ')') as classifications
    FROM products p
    JOIN product_categories pc ON p.id = pc.product_id
    JOIN categories c ON pc.category_id = c.id
    GROUP BY p.id, p.name
    LIMIT 3;
  `);
  console.log('Sample classifications preview:');
  console.log(JSON.stringify(sampleJoin.rows, null, 2));

  await pool.end();
  console.log('🎉 Migration completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  pool.end();
});
