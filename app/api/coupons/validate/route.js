import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { VALID_PROMOS } from "@/utils/orderStorage";

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, error: "Coupon code is required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check database if connected
    const dbStatus = await testDbConnection();
    if (dbStatus.connected) {
      const res = await query(
        "SELECT code, percent, label, is_active FROM utoor_coupons WHERE UPPER(code) = $1 AND is_active = true LIMIT 1;",
        [cleanCode]
      );
      if (res.rows.length > 0) {
        const c = res.rows[0];
        return NextResponse.json({
          valid: true,
          code: c.code,
          percent: c.percent,
          label: c.label || `${c.percent}% Discount Applied`,
        });
      }
    }

    // Fallback to static VALID_PROMOS
    if (VALID_PROMOS[cleanCode]) {
      const p = VALID_PROMOS[cleanCode];
      return NextResponse.json({
        valid: true,
        code: cleanCode,
        percent: p.percent,
        label: p.label,
      });
    }

    return NextResponse.json({
      valid: false,
      error: "Invalid or expired promo code.",
    });
  } catch (err) {
    console.error("Coupon validation error:", err);
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
