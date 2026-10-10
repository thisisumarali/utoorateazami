import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { VALID_PROMOS } from "@/utils/orderStorage";

export async function GET() {
  const dbStatus = await testDbConnection();
  if (!dbStatus.connected) {
    const fallbackCoupons = Object.entries(VALID_PROMOS).map(([code, val], i) => ({
      id: i + 1,
      code,
      percent: val.percent,
      label: val.label,
      is_active: true,
    }));
    return NextResponse.json({ dbConnected: false, coupons: fallbackCoupons });
  }

  try {
    const res = await query("SELECT * FROM utoor_coupons ORDER BY created_at DESC;");
    return NextResponse.json({ dbConnected: true, coupons: res.rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { code, percent, label } = await request.json();
    if (!code || !percent) {
      return NextResponse.json({ error: "Code and percentage discount are required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanPercent = Math.min(100, Math.max(1, parseInt(percent, 10)));

    const res = await query(
      `INSERT INTO utoor_coupons (code, percent, label, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (code) DO UPDATE SET
         percent = EXCLUDED.percent,
         label = EXCLUDED.label,
         is_active = true
       RETURNING *;`,
      [cleanCode, cleanPercent, label || `${cleanPercent}% Discount Coupon`]
    );

    return NextResponse.json({ success: true, coupon: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
