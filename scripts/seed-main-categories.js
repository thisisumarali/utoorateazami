const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim() : 'postgresql://postgres:root@localhost:5432/utoorateazami';

const pool = new Pool({ connectionString: dbUrl });

async function seedParents() {
  try {
    console.log('--- Setting up Main / Parent Categories ---');

    // 1. Define Main Categories (Top-level parents)
    const MAIN_CATEGORIES = [
      {
        id: 'main-mens',
        name: "Men's Collection",
        title: 'Bold, Woody & Aromatic Fragrances for Men',
        image: 'https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png',
        type: 'main',
      },
      {
        id: 'main-womens',
        name: "Women's Collection",
        title: 'Delicate Florals, Sweet Amber & Royal Jasmine',
        image: 'https://utoorateazami.com/wp-content/uploads/2024/08/65-2-1024x1024.png',
        type: 'main',
      },
      {
        id: 'main-oud',
        name: 'Oud & Agarwood Heritage',
        title: 'Smoky, Sacred & Regal Aged Hindi & Cambodian Agarwood',
        image: 'https://utoorateazami.com/wp-content/uploads/2024/09/jood-al-layl-1024x1024.png',
        type: 'main',
      },
      {
        id: 'main-unisex',
        name: 'Unisex Fragrances',
        title: 'Versatile, Balanced & Universal Oriental Essences',
        image: 'https://utoorateazami.com/wp-content/uploads/2024/08/65-2-1024x1024.png',
        type: 'main',
      },
      {
        id: 'main-gifts',
        name: 'Royal Gift Sets',
        title: 'Luxury Flacons Encased in Velvet & Gold Presentation Boxes',
        image: 'https://utoorateazami.com/wp-content/uploads/2024/03/shamekh-gs-min-600x800-1-300x300.png',
        type: 'main',
      },
      {
        id: 'main-artisanal',
        name: 'Azamis Artisanal Specials',
        title: 'Exclusive Limited-Distillation Signature Attars & Perfumes',
        image: 'https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png',
        type: 'main',
      },
    ];

    for (const mc of MAIN_CATEGORIES) {
      await pool.query(
        `INSERT INTO categories (id, name, title, image, type, parent_id, updated_at)
         VALUES ($1, $2, $3, $4, $5, NULL, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           title = EXCLUDED.title,
           image = EXCLUDED.image,
           type = EXCLUDED.type,
           updated_at = NOW();`,
        [mc.id, mc.name, mc.title, mc.image, mc.type]
      );
    }
    console.log('✓ Main categories seeded/updated.');

    // 2. Link some subcategories to their corresponding parent categories as initial links
    const INITIAL_LINKS = {
      // Subcategory ID -> Parent ID
      'men': 'main-mens',
      'mens': 'main-mens',
      'women': 'main-womens',
      'oud': 'main-oud',
      'arabic': 'main-oud',
      'eastern': 'main-oud',
      'unisex': 'main-unisex',
      'gift-set': 'main-gifts',
      'azamis-special': 'main-artisanal',
      'attar': 'main-artisanal',
      'perfume': 'main-artisanal',
      'french': 'main-womens',
      'western': 'main-mens',
    };

    for (const [subId, parentId] of Object.entries(INITIAL_LINKS)) {
      await pool.query(
        `UPDATE categories SET parent_id = $1, updated_at = NOW() WHERE id = $2;`,
        [parentId, subId]
      );
    }
    console.log('✓ Subcategories linked to main parent categories.');

    // 3. Inspect main categories and their linked subcategories
    const res = await pool.query(`
      SELECT 
        m.id,
        m.name,
        m.title,
        m.type,
        COUNT(s.id)::int AS subcategories_count,
        COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'type', s.type)) FILTER (WHERE s.id IS NOT NULL), '[]'::json) AS subcategories
      FROM categories m
      LEFT JOIN categories s ON m.id = s.parent_id
      WHERE m.type = 'main' OR m.id LIKE 'main-%'
      GROUP BY m.id, m.name, m.title, m.type
      ORDER BY m.name;
    `);

    console.log('Main categories query result:');
    for (const row of res.rows) {
      console.log(`- ${row.name} (${row.id}) | Subcategories: ${row.subcategories_count}`, row.subcategories.map(s => s.name));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

seedParents();
