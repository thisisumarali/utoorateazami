import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ALL";
  const search = searchParams.get("search") || "";

  const dbStatus = await testDbConnection();
  if (!dbStatus.connected) {
    return NextResponse.json({
      dbConnected: false,
      messages: [],
      unreadCount: 0,
      totalCount: 0,
    });
  }

  try {
    let whereClauses = [];
    let params = [];

    if (status && status !== "ALL") {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClauses.push(`(
        LOWER(name) LIKE $${params.length} OR
        LOWER(phone) LIKE $${params.length} OR
        LOWER(email) LIKE $${params.length} OR
        LOWER(topic) LIKE $${params.length} OR
        LOWER(message) LIKE $${params.length}
      )`);
    }

    const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const listSql = `
      SELECT id, name, phone, email, topic, message, status, notes, created_at, updated_at
      FROM utoor_contact_messages
      ${whereSql}
      ORDER BY created_at DESC;
    `;

    const countsSql = `
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'Unread' THEN 1 END)::int as unread,
        COUNT(CASE WHEN status = 'Read' THEN 1 END)::int as read,
        COUNT(CASE WHEN status = 'Replied' THEN 1 END)::int as replied
      FROM utoor_contact_messages;
    `;

    const [listRes, countsRes] = await Promise.all([
      query(listSql, params),
      query(countsSql),
    ]);

    const counts = countsRes.rows[0] || { total: 0, unread: 0, read: 0, replied: 0 };

    return NextResponse.json({
      dbConnected: true,
      messages: listRes.rows,
      counts: {
        total: counts.total || 0,
        unread: counts.unread || 0,
        read: counts.read || 0,
        replied: counts.replied || 0,
      },
    });
  } catch (err) {
    console.error("Fetch contact messages error:", err);
    return NextResponse.json(
      { error: "Failed to fetch contact messages", details: err.message },
      { status: 500 }
    );
  }
}
