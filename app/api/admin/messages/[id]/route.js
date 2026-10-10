import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PUT /api/admin/messages/[id] - Update status or notes
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, notes } = body;

    const fields = [];
    const values = [];

    if (status !== undefined) {
      values.push(status);
      fields.push(`status = $${values.length}`);
    }

    if (notes !== undefined) {
      values.push(notes);
      fields.push(`notes = $${values.length}`);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const sql = `
      UPDATE utoor_contact_messages
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *;
    `;

    const res = await query(sql, values);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: res.rows[0] });
  } catch (err) {
    console.error("Update message error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/messages/[id] - Delete a message
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const res = await query(
      "DELETE FROM utoor_contact_messages WHERE id = $1 RETURNING id, name;",
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
      deletedName: res.rows[0].name,
    });
  } catch (err) {
    console.error("Delete message error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
