import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const isNumeric = /^\d+$/.test(String(id).trim());
    const sql = isNumeric
      ? "SELECT * FROM utoor_orders WHERE id = $1 LIMIT 1;"
      : "SELECT * FROM utoor_orders WHERE order_number = $1 LIMIT 1;";
    const res = await query(sql, [isNumeric ? parseInt(id, 10) : id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      status,
      customer_name,
      customer_phone,
      customer_city,
      customer_address,
      customer_notes,
    } = body;

    const fields = [];
    const values = [];

    if (status !== undefined) {
      values.push(status);
      fields.push(`status = $${values.length}`);
    }
    if (customer_name !== undefined) {
      values.push(customer_name);
      fields.push(`customer_name = $${values.length}`);
    }
    if (customer_phone !== undefined) {
      values.push(customer_phone);
      fields.push(`customer_phone = $${values.length}`);
    }
    if (customer_city !== undefined) {
      values.push(customer_city);
      fields.push(`customer_city = $${values.length}`);
    }
    if (customer_address !== undefined) {
      values.push(customer_address);
      fields.push(`customer_address = $${values.length}`);
    }
    if (customer_notes !== undefined) {
      values.push(customer_notes);
      fields.push(`customer_notes = $${values.length}`);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.push("updated_at = NOW()");

    const isNumeric = /^\d+$/.test(String(id).trim());
    values.push(isNumeric ? parseInt(id, 10) : id);

    const updateSql = isNumeric
      ? `UPDATE utoor_orders SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *;`
      : `UPDATE utoor_orders SET ${fields.join(", ")} WHERE order_number = $${values.length} RETURNING *;`;

    const res = await query(updateSql, values);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = res.rows[0];

    // Log status update
    if (status) {
      await query(
        `INSERT INTO utoor_activity_logs (action, details, admin_email)
         VALUES ($1, $2, $3);`,
        [
          "ORDER_STATUS_CHANGED",
          `Order ${updatedOrder.order_number} status updated to ${status}`,
          "salman@utoorate.com",
        ]
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error("Order update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const isNumeric = /^\d+$/.test(String(id).trim());
    const sql = isNumeric
      ? "DELETE FROM utoor_orders WHERE id = $1 RETURNING order_number;"
      : "DELETE FROM utoor_orders WHERE order_number = $1 RETURNING order_number;";
    const res = await query(sql, [isNumeric ? parseInt(id, 10) : id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderNumber = res.rows[0].order_number;

    await query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["ORDER_DELETED", `Order ${orderNumber} was deleted from database`, "salman@utoorate.com"]
    ).catch(() => {});

    return NextResponse.json({ success: true, message: `Order ${orderNumber} deleted` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
