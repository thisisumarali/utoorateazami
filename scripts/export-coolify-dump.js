const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. Load local .env
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

const localPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/utoorateazami',
});

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val.toString();
  if (val instanceof Date) {
    return `'${val.toISOString()}'`;
  }
  if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportDump() {
  console.log('Connecting to local database to export Coolify SQL dump...');

  const tables = [
    'categories',
    'products',
    'product_categories',
    'utoor_orders',
    'utoor_contacts',
    'utoor_customers',
    'utoor_coupons',
    'utoor_reviews',
  ];

  let sqlDump = `-- ============================================================
-- UTOORAT E AZAMI - POSTGRESQL PRODUCTION DATABASE DUMP
-- Created for Coolify / VPS Deployment
-- Date: ${new Date().toISOString()}
-- ============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING TABLES (Clean Slate Restore)
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS utoor_reviews CASCADE;
DROP TABLE IF EXISTS utoor_orders CASCADE;
DROP TABLE IF EXISTS utoor_coupons CASCADE;
DROP TABLE IF EXISTS utoor_contacts CASCADE;
DROP TABLE IF EXISTS utoor_customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 3. CREATE SCHEMAS & TABLES

-- Categories Table
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

-- Products Table
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
  subcategory VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Categories Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS product_categories (
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (product_id, category_id)
);

-- Orders Table
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

-- Contact Form Inquiries Table
CREATE TABLE IF NOT EXISTS utoor_contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT false
);

-- Customers Table
CREATE TABLE IF NOT EXISTS utoor_customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  city VARCHAR(100),
  address TEXT,
  total_orders INT DEFAULT 1,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS utoor_coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  percent INT NOT NULL,
  label VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS utoor_reviews (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY SPEED
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_utoor_orders_created_at ON utoor_orders(created_at DESC);

-- ============================================================
-- 3. INSERT DATA
-- ============================================================
`;

  for (const table of tables) {
    try {
      const res = await localPool.query(`SELECT * FROM ${table}`);
      console.log(`Exporting table ${table}: ${res.rows.length} rows`);

      if (res.rows.length > 0) {
        sqlDump += `\n-- ------------------------------------------------------------\n`;
        sqlDump += `-- Data for ${table} (${res.rows.length} rows)\n`;
        sqlDump += `-- ------------------------------------------------------------\n`;

        const cols = Object.keys(res.rows[0]);
        const colsList = cols.map(c => `"${c}"`).join(', ');

        for (const row of res.rows) {
          const valuesList = cols.map(c => escapeSqlValue(row[c])).join(', ');
          if (table === 'product_categories') {
            sqlDump += `INSERT INTO ${table} (${colsList}) VALUES (${valuesList}) ON CONFLICT (product_id, category_id) DO NOTHING;\n`;
          } else if (table === 'categories' || table === 'products') {
            sqlDump += `INSERT INTO ${table} (${colsList}) VALUES (${valuesList}) ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at;\n`;
          } else if (table === 'utoor_orders') {
            sqlDump += `INSERT INTO ${table} (${colsList}) VALUES (${valuesList}) ON CONFLICT (order_number) DO NOTHING;\n`;
          } else if (table === 'utoor_customers') {
            sqlDump += `INSERT INTO ${table} (${colsList}) VALUES (${valuesList}) ON CONFLICT (phone) DO NOTHING;\n`;
          } else if (table === 'utoor_coupons') {
            sqlDump += `INSERT INTO ${table} (${colsList}) VALUES (${valuesList}) ON CONFLICT (code) DO NOTHING;\n`;
          } else {
            sqlDump += `INSERT INTO ${table} (${colsList}) VALUES (${valuesList});\n`;
          }
        }
      }
    } catch (e) {
      console.warn(`Skipping ${table}:`, e.message);
    }
  }

  // 4. Synchronize serial sequences so new orders / items never get duplicate key errors
  sqlDump += `\n-- ------------------------------------------------------------\n`;
  sqlDump += `-- 4. SYNCHRONIZE SEQUENCES\n`;
  sqlDump += `-- ------------------------------------------------------------\n`;
  sqlDump += `SELECT setval(pg_get_serial_sequence('utoor_orders', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM utoor_orders;\n`;
  sqlDump += `SELECT setval(pg_get_serial_sequence('utoor_coupons', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM utoor_coupons;\n`;

  const dumpPath = path.resolve(__dirname, '..', 'coolify_database_dump.sql');
  fs.writeFileSync(dumpPath, sqlDump, 'utf8');

  console.log(`\nSQL dump exported successfully to: coolify_database_dump.sql (${(fs.statSync(dumpPath).size / 1024).toFixed(1)} KB)`);
  await localPool.end();
}

exportDump().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
