const { Pool } = require('pg');

async function sync() {
  const coolify = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  const local = new Pool({
    connectionString: 'postgresql://postgres:root@localhost:5432/utoorateazami',
  });

  try {
    const coolifyProds = await coolify.query('SELECT * FROM products');
    console.log('Fetched', coolifyProds.rows.length, 'products from Coolify');

    for (const p of coolifyProds.rows) {
      await local.query(`
        INSERT INTO products (
          id, name, category, category_display, tags, price_display,
          min_price, max_price, sale_badge, inspired_by, rating,
          reviews_count, image, secondary_image, description,
          pyramid, variants, in_stock, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          category_display = EXCLUDED.category_display,
          tags = EXCLUDED.tags,
          price_display = EXCLUDED.price_display,
          min_price = EXCLUDED.min_price,
          max_price = EXCLUDED.max_price,
          sale_badge = EXCLUDED.sale_badge,
          inspired_by = EXCLUDED.inspired_by,
          rating = EXCLUDED.rating,
          reviews_count = EXCLUDED.reviews_count,
          image = EXCLUDED.image,
          secondary_image = EXCLUDED.secondary_image,
          description = EXCLUDED.description,
          pyramid = EXCLUDED.pyramid,
          variants = EXCLUDED.variants,
          in_stock = EXCLUDED.in_stock,
          updated_at = EXCLUDED.updated_at;
      `, [
        p.id,
        p.name,
        p.category,
        p.category_display,
        JSON.stringify(p.tags || []),
        p.price_display,
        p.min_price,
        p.max_price,
        p.sale_badge,
        p.inspired_by,
        p.rating,
        p.reviews_count,
        p.image,
        p.secondary_image,
        p.description,
        JSON.stringify(p.pyramid || {}),
        JSON.stringify(p.variants || []),
        p.in_stock,
        p.created_at,
        p.updated_at,
      ]);
    }
    console.log('Successfully synced all products from Coolify to local DB!');
  } catch (e) {
    console.error('Sync error:', e);
  } finally {
    await coolify.end();
    await local.end();
  }
}

sync();
