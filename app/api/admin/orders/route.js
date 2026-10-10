import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { generateOrderId } from "@/utils/orderStorage";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const dbStatus = await testDbConnection();
  if (!dbStatus.connected) {
    return NextResponse.json({
      dbConnected: false,
      orders: [],
      error: dbStatus.error,
      hint: dbStatus.hint,
    });
  }

  try {
    let sql = `
      SELECT 
        id, order_number, customer_name, customer_phone, customer_email,
        customer_city, customer_address, customer_notes, items,
        payment_method, subtotal, discount_amount, discount_percent,
        shipping_fee, grand_total, status, created_at, updated_at
      FROM utoor_orders
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "ALL") {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(order_number) LIKE $${params.length} OR
        LOWER(customer_name) LIKE $${params.length} OR
        LOWER(customer_phone) LIKE $${params.length} OR
        LOWER(customer_city) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY created_at DESC;`;

    const res = await query(sql, params);

    return NextResponse.json({
      dbConnected: true,
      orders: res.rows,
    });
  } catch (err) {
    console.error("Orders list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: err.message },
      { status: 500 }
    );
  }
}

// Create Manual Order
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_city,
      customer_address,
      customer_notes,
      items,
      subtotal,
      discount_amount,
      discount_percent,
      shipping_fee,
      grand_total,
      payment_method,
      status,
    } = body;

    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer name, phone, and items are required" },
        { status: 400 }
      );
    }

    const orderNumber = body.order_number || generateOrderId();

    const insertSql = `
      INSERT INTO utoor_orders (
        order_number, customer_name, customer_phone, customer_email,
        customer_city, customer_address, customer_notes, items,
        payment_method, subtotal, discount_amount, discount_percent,
        shipping_fee, grand_total, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *;
    `;

    const res = await query(insertSql, [
      orderNumber,
      customer_name,
      customer_phone,
      customer_email || "",
      customer_city || "",
      customer_address || "",
      customer_notes || "",
      JSON.stringify(items),
      payment_method || "Cash on Delivery (COD)",
      subtotal || 0,
      discount_amount || 0,
      discount_percent || 0,
      shipping_fee || 0,
      grand_total || subtotal,
      status || "Confirmed",
    ]);

    // Log activity
    await query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["ORDER_CREATED_MANUAL", `Created manual order ${orderNumber} for ${customer_name}`, "salman@utoorate.com"]
    );

    return NextResponse.json({
      success: true,
      order: res.rows[0],
    });
  } catch (err) {
    console.error("Create manual order error:", err);
    return NextResponse.json(
      { error: "Failed to create order", details: err.message },
      { status: 500 }
    );
  }
}
