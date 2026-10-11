import { Pool } from "pg";
import { PRODUCTS, CATEGORIES } from "@/data/storeData";
import { VALID_PROMOS } from "@/utils/orderStorage";

let pool;

export function getPool() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:root@localhost:5432/utoorateazami";
  if (!global._pgPool || global._pgPoolUrl !== connectionString) {
    if (global._pgPool) {
      try {
        global._pgPool.end();
      } catch (e) {}
    }

    const isSsl =
      connectionString.includes("sslmode=require") ||
      connectionString.includes(".supabase.") ||
      connectionString.includes(".neon.") ||
      connectionString.includes("ssl=true");

    global._pgPool = new Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    });
    global._pgPoolUrl = connectionString;

    global._pgPool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });
  }
  return global._pgPool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

// Diagnostics check
export async function testDbConnection() {
  try {
    const p = getPool();
    const result = await p.query("SELECT current_database(), current_user, version(), NOW() as now;");
    const row = result.rows[0];
    return {
      connected: true,
      database: row.current_database,
      user: row.current_user,
      serverTime: row.now,
      version: row.version?.split(" ")?.slice(0, 2)?.join(" "),
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      code: err.code,
      hint: getTroubleshootingHint(err),
    };
  }
}

function getTroubleshootingHint(err) {
  if (!err) return "";
  if (err.code === "28P01") {
    return "Password authentication failed. Please update the password in your .env file (DATABASE_URL=postgresql://user:password@localhost:5432/utoorateazami).";
  }
  if (err.code === "3D000") {
    return "Database does not exist yet. You can create it or use our 'Initialize DB' button in Admin Settings.";
  }
  if (err.code === "ECONNREFUSED") {
    return "Could not connect to PostgreSQL on port 5432. Please ensure the PostgreSQL service is running.";
  }
  return err.message;
}

// Try to auto-create database if missing
export async function ensureDatabaseExists() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/utoorateazami";
  try {
    // Parse target DB name
    const url = new URL(connectionString);
    const targetDb = url.pathname.replace(/^\//, "");
    if (!targetDb || targetDb === "postgres") return;

    // Connect to 'postgres' administrative DB
    url.pathname = "/postgres";
    const adminPool = new Pool({
      connectionString: url.toString(),
      connectionTimeoutMillis: 4000,
    });

    const check = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1;",
      [targetDb]
    );

    if (check.rows.length === 0) {
      console.log(`Database "${targetDb}" not found. Creating database...`);
      await adminPool.query(`CREATE DATABASE "${targetDb}";`);
      console.log(`Database "${targetDb}" created successfully.`);
    }

    await adminPool.end();
  } catch (err) {
    console.warn("Notice during ensureDatabaseExists:", err.message);
  }
}

// Initialize tables and seed initial data
export async function initDatabase() {
  try {
    await ensureDatabaseExists();

    const p = getPool();

    // 1. Core Products Table (New many-to-many architecture)
    await p.query(`
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

    // Legacy table compatibility
    await p.query(`
      CREATE TABLE IF NOT EXISTS utoor_products (
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

    // 2. Orders Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS utoor_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(255),
        customer_city VARCHAR(100),
        customer_address TEXT,
        customer_notes TEXT,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        payment_method VARCHAR(100) DEFAULT 'Cash on Delivery (COD)',
        subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
        discount_amount NUMERIC(10, 2) DEFAULT 0,
        discount_percent INT DEFAULT 0,
        shipping_fee NUMERIC(10, 2) DEFAULT 0,
        grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Confirmed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Categories Table (Flexible perfume classifications & collections)
    await p.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        title VARCHAR(255),
        image TEXT,
        banner_image TEXT,
        description TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'collection',
        parent_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
        sort_order INT DEFAULT 1,
        show_in_nav VARCHAR(10) DEFAULT 'Yes',
        status VARCHAR(20) DEFAULT 'Active',
        meta_title TEXT,
        meta_description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_image TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 1;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_in_nav VARCHAR(10) DEFAULT 'Yes';
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_title TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_description TEXT;
    `);

    // Legacy utoor_categories compatibility
    await p.query(`
      CREATE TABLE IF NOT EXISTS utoor_categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        subtext VARCHAR(255),
        image TEXT,
        count_text VARCHAR(100),
        title VARCHAR(255),
        parent_id VARCHAR(100),
        category_type VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Product-Categories Many-to-Many Relationship Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (product_id, category_id)
      );
      CREATE INDEX IF NOT EXISTS idx_prod_cat_prod ON product_categories(product_id);
      CREATE INDEX IF NOT EXISTS idx_prod_cat_cat ON product_categories(category_id);
    `);

    // 4. Coupons Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS utoor_coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        percent INT NOT NULL,
        label VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4b. Home Showcase / Spotlight Settings Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS utoor_showcase_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'home_spotlight',
        title VARCHAR(255) NOT NULL DEFAULT 'AZAMIS SPECIAL',
        subtitle VARCHAR(255) DEFAULT '',
        product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      INSERT INTO utoor_showcase_settings (id, title, subtitle, product_ids)
      VALUES (
        'home_spotlight',
        'AZAMIS SPECIAL',
        '',
        '["shamekh-gift-set", "baccarat-rouge", "janan", "oud-al-azami", "silver-oud", "rakaan", "aventus-creed", "wisaal-oud"]'::jsonb
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5. Activity Logs Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS utoor_activity_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        admin_email VARCHAR(255) DEFAULT 'salman@utoorate.com',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 6. Contact Form Messages Table
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
      CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON utoor_contact_messages(status);
      CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON utoor_contact_messages(created_at DESC);
    `);

    // Seed categories table if empty
    const catCheck = await p.query("SELECT COUNT(*) FROM categories;");
    if (parseInt(catCheck.rows[0].count, 10) === 0 && CATEGORIES) {
      let sort = 1;
      for (const cat of CATEGORIES) {
        await p.query(
          `INSERT INTO categories (id, name, title, image, type, parent_id, sort_order, show_in_nav, status, updated_at)
           VALUES ($1, $2, $3, $4, 'collection', NULL, $5, 'Yes', 'Active', NOW())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             title = EXCLUDED.title,
             image = EXCLUDED.image,
             type = 'collection',
             sort_order = EXCLUDED.sort_order;`,
          [
            cat.id,
            cat.name,
            cat.subtext || cat.title || "Artisanal luxury fragrance",
            cat.image || "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png",
            sort++,
          ]
        );
      }
    }

    // Legacy utoor_categories sync
    const legacyCatCheck = await p.query("SELECT COUNT(*) FROM utoor_categories;");
    if (parseInt(legacyCatCheck.rows[0].count, 10) === 0 && CATEGORIES) {
      for (const cat of CATEGORIES) {
        await p.query(
          `INSERT INTO utoor_categories (id, name, subtext, image, count_text, title)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING;`,
          [cat.id, cat.name, cat.subtext || "", cat.image || "", cat.count || "", cat.title || ""]
        );
      }
    }

    // Seed Coupons if empty
    const couponCheck = await p.query("SELECT COUNT(*) FROM utoor_coupons;");
    if (parseInt(couponCheck.rows[0].count, 10) === 0 && VALID_PROMOS) {
      for (const [code, info] of Object.entries(VALID_PROMOS)) {
        await p.query(
          `INSERT INTO utoor_coupons (code, percent, label, is_active)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (code) DO NOTHING;`,
          [code, info.percent, info.label]
        );
      }
    }

    // Seed Products table if empty
    const prodCheck = await p.query("SELECT COUNT(*) FROM products;");
    if (parseInt(prodCheck.rows[0].count, 10) === 0 && PRODUCTS && PRODUCTS.length > 0) {
      for (const prod of PRODUCTS) {
        await p.query(
          `INSERT INTO products (
            id, name, category, category_display, tags, price_display,
            min_price, max_price, sale_badge, inspired_by, rating,
            reviews_count, image, secondary_image, description,
            pyramid, variants, in_stock
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO NOTHING;`,
          [
            prod.id,
            prod.name,
            prod.category || "attar",
            prod.categoryDisplay || "Attar",
            JSON.stringify(prod.tags || []),
            prod.priceDisplay || `Rs${prod.minPrice || 500} - Rs${prod.maxPrice || 2000}`,
            prod.minPrice || 500,
            prod.maxPrice || 2000,
            prod.saleBadge || null,
            prod.inspiredBy || null,
            prod.rating || 5.0,
            prod.reviewsCount || 0,
            prod.image || "",
            prod.secondaryImage || "",
            prod.description || "",
            JSON.stringify(prod.pyramid || {}),
            JSON.stringify(prod.variants || []),
            true,
          ]
        );

        // Also sync utoor_products
        await p.query(
          `INSERT INTO utoor_products (
            id, name, category, category_display, tags, price_display,
            min_price, max_price, sale_badge, inspired_by, rating,
            reviews_count, image, secondary_image, description,
            pyramid, variants, in_stock
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO NOTHING;`,
          [
            prod.id,
            prod.name,
            prod.category || "attar",
            prod.categoryDisplay || "Attar",
            JSON.stringify(prod.tags || []),
            prod.priceDisplay || `Rs${prod.minPrice || 500} - Rs${prod.maxPrice || 2000}`,
            prod.minPrice || 500,
            prod.maxPrice || 2000,
            prod.saleBadge || null,
            prod.inspiredBy || null,
            prod.rating || 5.0,
            prod.reviewsCount || 0,
            prod.image || "",
            prod.secondaryImage || "",
            prod.description || "",
            JSON.stringify(prod.pyramid || {}),
            JSON.stringify(prod.variants || []),
            true,
          ]
        );
      }
    }

    // Seed product_categories relationships if empty
    const relCheck = await p.query("SELECT COUNT(*) FROM product_categories;");
    if (parseInt(relCheck.rows[0].count, 10) === 0 && PRODUCTS) {
      for (const prod of PRODUCTS) {
        const catId = prod.category || "mens";
        await p.query(
          `INSERT INTO product_categories (product_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT (product_id, category_id) DO NOTHING;`,
          [prod.id, catId]
        );
        if (Array.isArray(prod.tags)) {
          for (const t of prod.tags) {
            await p.query(
              `INSERT INTO product_categories (product_id, category_id)
               SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM categories WHERE id = $2)
               ON CONFLICT (product_id, category_id) DO NOTHING;`,
              [prod.id, t]
            );
          }
        }
      }
    }

    // Seed initial orders if empty
    const orderCheck = await p.query("SELECT COUNT(*) FROM utoor_orders;");
    if (parseInt(orderCheck.rows[0].count, 10) === 0) {
      const demoOrders = [
        {
          order_number: "UA-84920",
          customer_name: "Hamza Tariq",
          customer_phone: "03001234567",
          customer_email: "hamza.tariq@gmail.com",
          customer_city: "Lahore",
          customer_address: "House 42, Block Y, Phase 3, DHA",
          customer_notes: "Please pack with extra velvet gift pouch",
          items: [
            {
              id: "silver-oud-6ml",
              productId: "silver-oud",
              name: "SILVER OUD",
              size: "6ml",
              price: 1000,
              quantity: 2,
              image: "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png",
            },
            {
              id: "janan-12ml",
              productId: "janan",
              name: "JANAN",
              size: "12ml",
              price: 2000,
              quantity: 1,
              image: "https://utoorateazami.com/wp-content/uploads/2024/08/11-1024x1024.png",
            },
          ],
          payment_method: "Cash on Delivery (COD)",
          subtotal: 4000,
          discount_amount: 400,
          discount_percent: 10,
          shipping_fee: 0,
          grand_total: 3600,
          status: "Confirmed",
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          order_number: "UA-92147",
          customer_name: "Dr. Bilal Farooqi",
          customer_phone: "03219876543",
          customer_email: "dr.bilal@shifa.org",
          customer_city: "Islamabad",
          customer_address: "Consultant Suites, Sector F-8/3",
          customer_notes: "Call upon arrival at reception",
          items: [
            {
              id: "rakaan-12ml",
              productId: "rakaan",
              name: "RAKAAN",
              size: "12ml",
              price: 2000,
              quantity: 1,
              image: "https://utoorateazami.com/wp-content/uploads/2024/08/5-1024x1024.png",
            },
          ],
          payment_method: "Cash on Delivery (COD)",
          subtotal: 2000,
          discount_amount: 0,
          discount_percent: 0,
          shipping_fee: 250,
          grand_total: 2250,
          status: "Shipped",
          created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        },
        {
          order_number: "UA-71035",
          customer_name: "Ayesha Malik",
          customer_phone: "03335551212",
          customer_email: "ayesha.malik@outlook.com",
          customer_city: "Karachi",
          customer_address: "Apartment 902, Creek Vistas, Phase 8, DHA",
          customer_notes: "Gift for brother's wedding",
          items: [
            {
              id: "aventus-creed-12ml",
              productId: "aventus-creed",
              name: "AVENTUS CREED",
              size: "12ml",
              price: 2000,
              quantity: 2,
              image: "https://utoorateazami.com/wp-content/uploads/2024/08/aventus-1024x1024.png",
            },
            {
              id: "silver-oud-3ml",
              productId: "silver-oud",
              name: "SILVER OUD",
              size: "3ml",
              price: 500,
              quantity: 1,
              image: "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png",
            },
          ],
          payment_method: "Cash on Delivery (COD)",
          subtotal: 4500,
          discount_amount: 675,
          discount_percent: 15,
          shipping_fee: 0,
          grand_total: 3825,
          status: "Delivered",
          created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        },
      ];

      for (const ord of demoOrders) {
        await p.query(
          `INSERT INTO utoor_orders (
            order_number, customer_name, customer_phone, customer_email,
            customer_city, customer_address, customer_notes, items,
            payment_method, subtotal, discount_amount, discount_percent,
            shipping_fee, grand_total, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16);`,
          [
            ord.order_number,
            ord.customer_name,
            ord.customer_phone,
            ord.customer_email,
            ord.customer_city,
            ord.customer_address,
            ord.customer_notes,
            JSON.stringify(ord.items),
            ord.payment_method,
            ord.subtotal,
            ord.discount_amount,
            ord.discount_percent,
            ord.shipping_fee,
            ord.grand_total,
            ord.status,
            ord.created_at,
          ]
        );
      }
    }

    // Log initialization activity
    await p.query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["SYSTEM_INIT", "Database initialized and verified schema successfully.", "salman@utoorate.com"]
    );

    return { success: true, message: "Database schema and tables initialized successfully." };
  } catch (err) {
    console.error("Database initialization error:", err);
    return {
      success: false,
      error: err.message,
      code: err.code,
      hint: getTroubleshootingHint(err),
    };
  }
}
