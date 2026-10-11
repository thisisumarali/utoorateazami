import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { PRODUCTS } from "@/data/storeData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

const DEFAULT_SHOWCASE_IDS = [
  "shamekh-gift-set",
  "baccarat-rouge",
  "janan",
  "oud-al-azami",
  "silver-oud",
  "rakaan",
  "aventus-creed",
  "wisaal-oud",
];

export async function GET() {
  const dbStatus = await testDbConnection();
  if (!dbStatus.connected) {
    const fallbackProducts = DEFAULT_SHOWCASE_IDS.map((id) =>
      PRODUCTS.find((p) => p.id === id)
    ).filter(Boolean);

    return NextResponse.json(
      {
        success: true,
        title: "AZAMIS SPECIAL",
        subtitle: "",
        product_ids: DEFAULT_SHOWCASE_IDS,
        products: fallbackProducts,
        dbConnected: false,
      },
      { headers: noCacheHeaders }
    );
  }

  try {
    const settingRes = await query(
      "SELECT id, title, subtitle, product_ids, is_active, updated_at FROM utoor_showcase_settings WHERE id = 'home_spotlight' LIMIT 1"
    );

    let title = "AZAMIS SPECIAL";
    let subtitle = "";
    let productIds = DEFAULT_SHOWCASE_IDS;
    let updatedAt = new Date().toISOString();

    if (settingRes.rows.length > 0) {
      const row = settingRes.rows[0];
      if (row.title) title = row.title;
      if (row.subtitle !== undefined && row.subtitle !== null) subtitle = row.subtitle;
      if (Array.isArray(row.product_ids) && row.product_ids.length > 0) {
        productIds = row.product_ids;
      }
      if (row.updated_at) updatedAt = row.updated_at;
    }

    // Fetch product details for selected IDs
    const prodRes = await query(
      `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.category_display,
        p.price_display,
        p.min_price,
        p.max_price,
        p.sale_badge,
        p.image,
        p.in_stock,
        p.variants
      FROM products p
      WHERE p.id = ANY($1);
    `,
      [productIds]
    );

    const map = new Map();
    prodRes.rows.forEach((p) => map.set(p.id, p));

    const selectedProducts = productIds
      .map((id) => map.get(id) || PRODUCTS.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json(
      {
        success: true,
        title,
        subtitle,
        product_ids: productIds,
        products: selectedProducts,
        updated_at: updatedAt,
        dbConnected: true,
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error("Admin Showcase GET error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { title, subtitle, product_ids } = body;

    const cleanTitle = (title && title.trim()) ? title.trim() : "AZAMIS SPECIAL";
    const cleanSubtitle = subtitle !== undefined && subtitle !== null ? String(subtitle).trim() : "";

    // Validate product_ids is array
    let cleanIds = [];
    if (Array.isArray(product_ids)) {
      cleanIds = product_ids.filter((id) => typeof id === "string" && id.trim().length > 0);
    }
    if (cleanIds.length === 0) {
      cleanIds = DEFAULT_SHOWCASE_IDS;
    }

    // Limit to at most 8 products
    cleanIds = cleanIds.slice(0, 8);

    const upsertRes = await query(
      `
      INSERT INTO utoor_showcase_settings (id, title, subtitle, product_ids, updated_at)
      VALUES ('home_spotlight', $1, $2, $3::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        product_ids = EXCLUDED.product_ids,
        updated_at = NOW()
      RETURNING *;
    `,
      [cleanTitle, cleanSubtitle, JSON.stringify(cleanIds)]
    );

    // Log admin activity
    try {
      await query(
        `INSERT INTO utoor_activity_logs (action, details, admin_email)
         VALUES ($1, $2, $3);`,
        [
          "SHOWCASE_UPDATE",
          `Updated showcase title to "${cleanTitle}" with ${cleanIds.length} featured products.`,
          "salman@utoorate.com",
        ]
      );
    } catch (logErr) {
      // Non-blocking log error
    }

    // Fetch updated products
    const prodRes = await query(
      `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.category_display,
        p.price_display,
        p.min_price,
        p.max_price,
        p.sale_badge,
        p.image,
        p.in_stock,
        p.variants
      FROM products p
      WHERE p.id = ANY($1);
    `,
      [cleanIds]
    );

    const map = new Map();
    prodRes.rows.forEach((p) => map.set(p.id, p));

    const selectedProducts = cleanIds
      .map((id) => map.get(id) || PRODUCTS.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json(
      {
        success: true,
        message: "Home showcase updated successfully!",
        data: upsertRes.rows[0],
        products: selectedProducts,
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error("Admin Showcase PUT error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
