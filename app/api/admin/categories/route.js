import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { CATEGORIES } from "@/data/storeData";

export async function GET() {
  const dbStatus = await testDbConnection();
  if (!dbStatus.connected) {
    return NextResponse.json({
      dbConnected: false,
      categories: CATEGORIES,
      hint: dbStatus.hint,
    });
  }

  try {
    // Fetch all categories with product count
    const res = await query(`
      SELECT 
        c.id,
        c.name,
        c.title,
        c.description,
        c.image,
        c.banner_image,
        c.type,
        c.sort_order,
        c.show_in_nav,
        c.status,
        c.meta_title,
        c.meta_description,
        c.created_at,
        c.updated_at,
        (SELECT COUNT(*)::int FROM product_categories pc WHERE pc.category_id = c.id) AS product_count
      FROM categories c
      ORDER BY 
        c.sort_order ASC,
        c.name ASC;
    `);

    return NextResponse.json({
      dbConnected: true,
      categories: res.rows,
    });
  } catch (err) {
    console.error("Categories fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      image,
      banner_image,
      sort_order,
      show_in_nav,
      status,
      meta_title,
      meta_description,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const rawSlug = (slug?.trim() || cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const id = rawSlug || `cat-${Date.now()}`;
    const catImage = image?.trim() || "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png";
    const catBanner = banner_image?.trim() || catImage;
    const catDesc = description?.trim() || cleanName;
    const catSort = parseInt(sort_order, 10) || 1;
    const catNav = show_in_nav === "No" ? "No" : "Yes";
    const catStatus = status === "Inactive" ? "Inactive" : "Active";
    const catMetaTitle = meta_title?.trim() || `${cleanName} | Utoor-e-Azami Luxury Fragrances`;
    const catMetaDesc = meta_description?.trim() || catDesc;

    // Insert into categories table
    const res = await query(
      `INSERT INTO categories (
        id, name, title, description, image, banner_image,
        type, parent_id, sort_order, show_in_nav, status,
        meta_title, meta_description, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'collection', NULL, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;`,
      [
        id,
        cleanName,
        catDesc,
        catDesc,
        catImage,
        catBanner,
        catSort,
        catNav,
        catStatus,
        catMetaTitle,
        catMetaDesc,
      ]
    );

    // Sync legacy utoor_categories
    await query(
      `INSERT INTO utoor_categories (id, name, subtext, image, count_text, title, parent_id, category_type)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, 'main')
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         title = EXCLUDED.title,
         image = EXCLUDED.image;`,
      [id, cleanName, catDesc, catImage, "0 Products", catDesc]
    ).catch(() => {});

    // Activity log
    await query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["CATEGORY_CREATED", `Created category "${cleanName}" (${id})`, "salman@utoorate.com"]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      category: res.rows[0],
    });
  } catch (err) {
    console.error("Create category error:", err);
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "A category with this ID or slug already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
