import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { generateOrderId } from "@/utils/orderStorage";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      customer,
      items,
      paymentMethod,
      subtotal,
      discountAmount,
      discountPercent,
      shippingFee,
      grandTotal,
    } = body;

    const orderNumber = orderId || generateOrderId();

    const dbStatus = await testDbConnection();
    if (dbStatus.connected) {
      const sql = `
        INSERT INTO utoor_orders (
          order_number, customer_name, customer_phone, customer_email,
          customer_city, customer_address, customer_notes, items,
          payment_method, subtotal, discount_amount, discount_percent,
          shipping_fee, grand_total, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Confirmed', NOW(), NOW())
        RETURNING *;
      `;

      const res = await query(sql, [
        orderNumber,
        customer?.name || "Customer",
        customer?.phone || "",
        customer?.email || "",
        customer?.city || "",
        customer?.address || "",
        customer?.notes || "",
        JSON.stringify(items || []),
        paymentMethod || "Cash on Delivery (COD)",
        subtotal || 0,
        discountAmount || 0,
        discountPercent || 0,
        shippingFee || 0,
        grandTotal || 0,
      ]);

      return NextResponse.json({
        success: true,
        savedToDb: true,
        order: res.rows[0],
      });
    }

    // Graceful offline response
    return NextResponse.json({
      success: true,
      savedToDb: false,
      order: {
        order_number: orderNumber,
        customer_name: customer?.name,
        customer_phone: customer?.phone,
        grand_total: grandTotal,
      },
    });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: "Failed to process order", details: err.message },
      { status: 500 }
    );
  }
}
