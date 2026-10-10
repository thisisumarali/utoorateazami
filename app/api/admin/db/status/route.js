import { NextResponse } from "next/server";
import { testDbConnection, query } from "@/lib/db";

export async function GET() {
  const status = await testDbConnection();

  if (status.connected) {
    try {
      const counts = await Promise.all([
        query("SELECT COUNT(*) FROM utoor_products;").catch(() => ({ rows: [{ count: 0 }] })),
        query("SELECT COUNT(*) FROM utoor_orders;").catch(() => ({ rows: [{ count: 0 }] })),
        query("SELECT COUNT(*) FROM utoor_categories;").catch(() => ({ rows: [{ count: 0 }] })),
        query("SELECT COUNT(*) FROM utoor_coupons;").catch(() => ({ rows: [{ count: 0 }] })),
      ]);

      return NextResponse.json({
        ...status,
        counts: {
          products: parseInt(counts[0].rows[0]?.count || 0, 10),
          orders: parseInt(counts[1].rows[0]?.count || 0, 10),
          categories: parseInt(counts[2].rows[0]?.count || 0, 10),
          coupons: parseInt(counts[3].rows[0]?.count || 0, 10),
        },
      });
    } catch (e) {
      return NextResponse.json({ ...status, counts: null });
    }
  }

  return NextResponse.json(status);
}
