import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { PRODUCTS } from "@/data/storeData";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const stock = searchParams.get("stock");
  const search = searchParams.get("search");

  const dbStatus = await testDbConnection();

  if (!dbStatus.connected) {
    let filtered = PRODUCTS.map((p) => ({
      ...p,
      category_ids: [p.category].filter(Boolean),
    }));
    if (category && category !== "ALL") {
      filtered = filtered.filter(
        (p) =>
          (p.categoryDisplay || "").toLowerCase().includes(category.toLowerCase()) ||
          (p.category_ids || []).includes(category.toLowerCase())
      );
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    }
    return NextResponse.json({
      dbConnected: false,
      products: filtered,
      hint: dbStatus.hint,
    });
  }

  try {
    const params = [];
    let whereClauses = [];

    if (category && category !== "ALL") {
      params.push(category);
      whereClauses.push(
        `(p.category = $${params.length} OR p.category_display ILIKE '%' || $${params.length} || '%' OR EXISTS (SELECT 1 FROM product_categories pc_filter WHERE pc_filter.product_id = p.id AND pc_filter.category_id = $${params.length}))`
      );
    }

    if (stock === "in") {
      whereClauses.push(`p.in_stock = true`);
    } else if (stock === "out") {
      whereClauses.push(`p.in_stock = false`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClauses.push(
        `(LOWER(p.name) LIKE $${params.length} OR LOWER(p.id) LIKE $${params.length} OR LOWER(COALESCE(p.inspired_by, '')) LIKE $${params.length})`
      );
    }

    const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const sql = `
      SELECT 
        p.id, p.name, p.category, p.category_display, p.tags, p.price_display,
        p.min_price, p.max_price, p.sale_badge, p.inspired_by, p.rating,
        p.reviews_count, p.image, p.secondary_image, p.description,
        p.pyramid, p.variants, p.in_stock, p.created_at, p.updated_at,
        COALESCE(array_agg(DISTINCT pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL), '{}'::varchar[]) AS category_ids,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'title', c.title, 'type', c.type)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) AS classifications
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${whereSql}
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;

    const res = await query(sql, params);

    return NextResponse.json({
      dbConnected: true,
      products: res.rows,
    });
  } catch (err) {
    console.error("Products list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products", details: err.message },
      { status: 500 }
    );
  }
}

// Create New Product
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      category_display,
      tags,
      min_price,
      max_price,
      sale_badge,
      inspired_by,
      image,
      secondary_image,
      description,
      pyramid,
      variants,
      in_stock,
      category_ids,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const baseSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = body.id || `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

    const priceDisplay =
      body.price_display ||
      (min_price === max_price
        ? `Rs${min_price}`
        : `Rs${min_price || 500}.00 – Rs${max_price || 2000}.00`);

    // 1. Insert into products table
    const sql = `
      INSERT INTO products (
        id, name, category, category_display, tags, price_display,
        min_price, max_price, sale_badge, inspired_by, rating,
        reviews_count, image, secondary_image, description,
        pyramid, variants, in_stock, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *;
    `;

    const res = await query(sql, [
      id,
      cleanName.toUpperCase(),
      category || "mens",
      category_display || (category ? category.replace(/-/g, " ").toUpperCase() : "MEN'S"),
      JSON.stringify(tags || [category || "mens"]),
      priceDisplay,
      min_price || 500,
      max_price || 2000,
      sale_badge || null,
      inspired_by || null,
      5.0,
      0,
      image || "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png",
      secondary_image || "",
      description || "",
      JSON.stringify(pyramid || { top: "", heart: "", base: "" }),
      JSON.stringify(
        variants || [
          { size: "3ml", price: 500, regularPrice: 625, inStock: true },
          { size: "6ml", price: 1000, regularPrice: 1250, inStock: true },
          { size: "12ml", price: 2000, regularPrice: 2500, inStock: true },
        ]
      ),
      in_stock !== undefined ? in_stock : true,
    ]);

    // 2. Insert into product_categories table
    if (Array.isArray(category_ids) && category_ids.length > 0) {
      for (const catId of category_ids) {
        await query(
          `INSERT INTO product_categories (product_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT (product_id, category_id) DO NOTHING;`,
          [id, catId]
        ).catch(() => {});
      }
    }

    // 3. Sync to legacy utoor_products
    await query(
      `INSERT INTO utoor_products (
        id, name, category, category_display, tags, price_display,
        min_price, max_price, sale_badge, inspired_by, rating,
        reviews_count, image, secondary_image, description,
        pyramid, variants, in_stock, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        category_display = EXCLUDED.category_display,
        tags = EXCLUDED.tags,
        price_display = EXCLUDED.price_display,
        min_price = EXCLUDED.min_price,
        max_price = EXCLUDED.max_price,
        image = EXCLUDED.image,
        description = EXCLUDED.description,
        updated_at = NOW();`,
      [
        id,
        cleanName.toUpperCase(),
        category || "attar",
        category_display || "Attar / Luxury",
        JSON.stringify(tags || ["attar"]),
        priceDisplay,
        min_price || 500,
        max_price || 2000,
        sale_badge || null,
        inspired_by || null,
        5.0,
        0,
        image || "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png",
        secondary_image || "",
        description || "",
        JSON.stringify(pyramid || { top: "", heart: "", base: "" }),
        JSON.stringify(
          variants || [
            { size: "3ml", price: 500, regularPrice: 625, inStock: true },
            { size: "6ml", price: 1000, regularPrice: 1250, inStock: true },
            { size: "12ml", price: 2000, regularPrice: 2500, inStock: true },
          ]
        ),
        in_stock !== undefined ? in_stock : true,
      ]
    ).catch(() => {});

    await query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["PRODUCT_CREATED", `Added fragrance product "${cleanName}" (ID: ${id})`, "salman@utoorate.com"]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      product: {
        ...res.rows[0],
        category_ids: category_ids || [],
      },
    });
  } catch (err) {
    console.error("Create product error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
