const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:utooratedb123@169.58.205.65:15432/postgres',
  ssl: false,
});

async function fixCoolify() {
  console.log('Syncing all sequences on Coolify database...');
  try {
    const resOrders = await pool.query("SELECT setval(pg_get_serial_sequence('utoor_orders', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM utoor_orders;");
    console.log('✓ utoor_orders sequence synced to:', resOrders.rows[0]);

    const resCoupons = await pool.query("SELECT setval(pg_get_serial_sequence('utoor_coupons', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM utoor_coupons;");
    console.log('✓ utoor_coupons sequence synced to:', resCoupons.rows[0]);

    const resLogs = await pool.query("SELECT setval(pg_get_serial_sequence('utoor_activity_logs', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM utoor_activity_logs;");
    console.log('✓ utoor_activity_logs sequence synced to:', resLogs.rows[0]);

    const resMsgs = await pool.query("SELECT setval(pg_get_serial_sequence('utoor_contact_messages', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM utoor_contact_messages;");
    console.log('✓ utoor_contact_messages sequence synced to:', resMsgs.rows[0]);

    // Test inserting an order now!
    const testSql = `
      INSERT INTO utoor_orders (
        order_number, customer_name, customer_phone, customer_email,
        customer_city, customer_address, customer_notes, items,
        payment_method, subtotal, discount_amount, discount_percent,
        shipping_fee, grand_total, status, created_at, updated_at
      ) VALUES (
        'UA-COOLIFY-TEST-1', 'Umar Ali Test', '03001234567', 'test@utoorate.com',
        'Sadiqabad', 'Klp Road', '', '[]'::jsonb,
        'Cash on Delivery (COD)', 5000, 0, 0, 0, 5000, 'Confirmed', NOW(), NOW()
      ) RETURNING *;
    `;
    const testRes = await pool.query(testSql);
    console.log('>>> TEST ORDER INSERTED SUCCESSFULLY ON COOLIFY! Order ID:', testRes.rows[0].id, 'Order #:', testRes.rows[0].order_number);

  } catch (e) {
    console.error('Error syncing Coolify sequences:', e);
  } finally {
    await pool.end();
  }
}

fixCoolify();
