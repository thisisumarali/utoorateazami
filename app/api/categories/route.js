import { NextResponse } from "next/server";
import { query, testDbConnection } from "@/lib/db";
import { CATEGORIES } from "@/data/storeData";

export async function GET() {
  const dbStatus = await testDbConnection();

  if (!dbStatus.connected) {
    const formatted = CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      title: c.subtext || c.title || "",
      image: c.image,
      product_count: parseInt(c.count || "0", 10) || 0,
      show_in_nav: "Yes",
      status: "Active",
    }));

    return NextResponse.json({
      dbConnected: false,
      categories: formatted,
      mainCategories: formatted,
      subcategories: [],
      source: "fallback",
    });
  }

  try {
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
        COUNT(pc.product_id)::int AS product_count
      FROM categories c
      LEFT JOIN product_categories pc ON pc.category_id = c.id
      WHERE c.status = 'Active' OR c.status IS NULL
      GROUP BY c.id, c.name, c.title, c.description, c.image, c.banner_image, c.type, c.sort_order, c.show_in_nav, c.status
      ORDER BY c.sort_order ASC, c.name ASC;
    `);

    return NextResponse.json({
      dbConnected: true,
      categories: res.rows,
      mainCategories: res.rows,
      subcategories: [],
      source: "postgres",
    });
  } catch (err) {
    console.error("Public categories API error:", err);
    return NextResponse.json({
      dbConnected: false,
      categories: CATEGORIES,
      mainCategories: CATEGORIES,
      subcategories: [],
      error: err.message,
    });
  }
}
