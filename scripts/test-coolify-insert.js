const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function test() {
  const sql = `
    INSERT INTO utoor_orders (
      order_number, customer_name, customer_phone, customer_email,
      customer_city, customer_address, customer_notes, items,
      payment_method, subtotal, discount_amount, discount_percent,
      shipping_fee, grand_total, status, created_at, updated_at
    ) VALUES (
      'UA-TEST-999', 'Test User', '03001112233', '',
      'Lahore', 'Mall Road', '', '[]'::jsonb,
      'COD', 1000, 0, 0, 0, 1000, 'Confirmed', NOW(), NOW()
    ) RETURNING *;
  `;

  try {
    const res = await pool.query(sql);
    console.log('INSERT SUCCESS ON COOLIFY! Created order:', res.rows[0]);
    // Clean up test order
    await pool.query("DELETE FROM utoor_orders WHERE order_number = 'UA-TEST-999'");
  } catch (e) {
    console.error('INSERT FAILED ON COOLIFY:', e.message);
  } finally {
    await pool.end();
  }
}

test();
