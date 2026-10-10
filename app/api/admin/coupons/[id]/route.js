import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const { is_active, percent, label } = await request.json();
    const fields = [];
    const values = [];

    if (is_active !== undefined) {
      values.push(is_active);
      fields.push(`is_active = $${values.length}`);
    }
    if (percent !== undefined) {
      values.push(percent);
      fields.push(`percent = $${values.length}`);
    }
    if (label !== undefined) {
      values.push(label);
      fields.push(`label = $${values.length}`);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE utoor_coupons SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *;`;
    const res = await query(sql, values);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const res = await query("DELETE FROM utoor_coupons WHERE id = $1 RETURNING code;", [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Coupon ${res.rows[0].code} removed` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
