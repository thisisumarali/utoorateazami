import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { PRODUCTS } from "@/data/storeData";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const category = searchParams.get("category");
  const categoriesParam = searchParams.get("categories");

  // Parse requested category IDs
  let requestedCategoryIds = [];
  if (categoriesParam) {
    requestedCategoryIds = categoriesParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  } else if (category && category !== "all") {
    requestedCategoryIds = [category.trim().toLowerCase()];
  }

  const dbStatus = await testDbConnection();
  if (!dbStatus.connected) {
    let prods = [...PRODUCTS];

    if (tag) {
      prods = prods.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag));
    }

    if (requestedCategoryIds.length > 0) {
      const target = requestedCategoryIds[0];
      prods = prods.filter((p) => {
        const pCat = (p.category || "").toLowerCase();
        const pTags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).toLowerCase()) : [];
        return pCat === target || pTags.includes(target);
      });
    }

    return NextResponse.json({ products: prods, source: "fallback" });
  }

  try {
    const params = [];
    let whereClauses = [];
    const stockParam = searchParams.get("stock");
    const inStockOnly = searchParams.get("in_stock") === "true";
    if (inStockOnly || stockParam === "in" || stockParam === "in_stock") {
      whereClauses.push("p.in_stock = true");
    } else if (stockParam === "out" || stockParam === "out_of_stock") {
      whereClauses.push("p.in_stock = false");
    }

    if (tag) {
      params.push(tag);
      whereClauses.push(
        `(p.tags @> to_jsonb($${params.length}::text) OR p.category = $${params.length})`
      );
    }

    if (requestedCategoryIds.length > 0) {
      params.push(requestedCategoryIds);
      whereClauses.push(
        `(
          p.category = ANY($${params.length}::varchar[])
          OR EXISTS (
            SELECT 1 FROM product_categories pc_check 
            WHERE pc_check.product_id = p.id AND pc_check.category_id = ANY($${params.length}::varchar[])
          )
        )`
      );
    }

    const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const sql = `
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
        p.created_at,
        p.updated_at,
        COALESCE(
          array_agg(DISTINCT pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL),
          '{}'::varchar[]
        ) AS category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      ${whereSql}
      GROUP BY p.id
      ORDER BY p.in_stock DESC, p.rating DESC, p.created_at DESC;
    `;

    const res = await query(sql, params);

    return NextResponse.json({
      products: res.rows.length > 0 ? res.rows : [],
      source: "postgres",
      count: res.rows.length,
    });
  } catch (err) {
    console.error("Products API error:", err);
    return NextResponse.json(
      { products: PRODUCTS, source: "fallback", error: err.message },
      { status: 500 }
    );
  }
}
