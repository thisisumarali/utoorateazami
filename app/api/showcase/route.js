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
        products: fallbackProducts.length > 0 ? fallbackProducts : PRODUCTS.slice(0, 8),
        source: "fallback",
      },
      { headers: noCacheHeaders }
    );
  }

  try {
    // 1. Fetch showcase configuration
    const settingRes = await query(
      "SELECT id, title, subtitle, product_ids, is_active FROM utoor_showcase_settings WHERE id = 'home_spotlight' LIMIT 1"
    );

    let title = "AZAMIS SPECIAL";
    let subtitle = "";
    let productIds = DEFAULT_SHOWCASE_IDS;

    if (settingRes.rows.length > 0) {
      const row = settingRes.rows[0];
      if (row.title) title = row.title;
      if (row.subtitle !== undefined && row.subtitle !== null) subtitle = row.subtitle;
      if (Array.isArray(row.product_ids) && row.product_ids.length > 0) {
        productIds = row.product_ids;
      }
    }

    // 2. Fetch products for these IDs
    const prodRes = await query(
      `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.category_display,
        p.tags,
        p.price_display,
        p.min_price,
        p.max_price,
        p.sale_badge,
        p.inspired_by,
        p.rating,
        p.reviews_count,
        p.image,
        p.secondary_image,
        p.description,
        p.pyramid,
        p.variants,
        p.in_stock,
        p.is_hidden,
        COALESCE(
          array_agg(DISTINCT pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL),
          '{}'::varchar[]
        ) AS category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.id = ANY($1) AND (p.is_hidden IS NOT TRUE)
      GROUP BY p.id;
    `,
      [productIds]
    );

    // Map fetched products into the exact order defined by productIds
    const fetchedMap = new Map();
    prodRes.rows.forEach((p) => fetchedMap.set(p.id, p));

    let orderedProducts = [];
    productIds.forEach((id) => {
      if (fetchedMap.has(id)) {
        orderedProducts.push(fetchedMap.get(id));
      } else {
        const staticMatch = PRODUCTS.find((p) => p.id === id);
        if (staticMatch) orderedProducts.push(staticMatch);
      }
    });

    // If less than 8, backfill with default/popular products
    if (orderedProducts.length < 8) {
      for (const defId of DEFAULT_SHOWCASE_IDS) {
        if (!orderedProducts.some((p) => p.id === defId)) {
          if (fetchedMap.has(defId)) {
            orderedProducts.push(fetchedMap.get(defId));
          } else {
            const staticMatch = PRODUCTS.find((p) => p.id === defId);
            if (staticMatch) orderedProducts.push(staticMatch);
          }
        }
        if (orderedProducts.length >= 8) break;
      }
    }

    return NextResponse.json(
      {
        success: true,
        title,
        subtitle,
        product_ids: productIds,
        products: orderedProducts.slice(0, 8),
        source: "postgres",
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error("Showcase fetch error:", err);
    return NextResponse.json(
      {
        success: false,
        title: "AZAMIS SPECIAL",
        subtitle: "",
        product_ids: DEFAULT_SHOWCASE_IDS,
        products: PRODUCTS.slice(0, 8),
        error: err.message,
      },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
