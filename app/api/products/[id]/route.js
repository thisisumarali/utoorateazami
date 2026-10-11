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

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const dbStatus = await testDbConnection();
    if (dbStatus.connected) {
      const res = await query(
        `SELECT p.*,
          COALESCE(
            (SELECT json_agg(c.id) FROM product_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.product_id = p.id),
            '[]'::json
          ) AS category_ids
        FROM products p
        WHERE p.id = $1
        LIMIT 1;`,
        [id]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        let pyramid = row.pyramid;
        if (typeof pyramid === "string") {
          try {
            pyramid = JSON.parse(pyramid);
          } catch (e) {
            pyramid = { top: "", heart: "", base: "" };
          }
        }
        let variants = row.variants;
        if (typeof variants === "string") {
          try {
            variants = JSON.parse(variants);
          } catch (e) {
            variants = [
              { size: "3ml", price: parseFloat(row.min_price) || 500 },
              { size: "6ml", price: 1000 },
              { size: "12ml", price: parseFloat(row.max_price) || 2000 },
            ];
          }
        }
        const productInStock = row.in_stock !== false;
        const mappedVariants = (Array.isArray(variants) ? variants : [
          { size: "3ml", price: parseFloat(row.min_price) || 500, inStock: true },
          { size: "6ml", price: 1000, inStock: true },
          { size: "12ml", price: parseFloat(row.max_price) || 2000, inStock: true },
        ]).map((v) => ({
          ...v,
          price: parseFloat(v.price) || 500,
          regularPrice: v.regularPrice ? parseFloat(v.regularPrice) : null,
          inStock: productInStock && v.inStock !== false && v.in_stock !== false && v.status !== "Out of Stock",
        }));

        const formatted = {
          id: row.id,
          name: row.name,
          category: row.category,
          categoryDisplay: row.category_display || row.category,
          tags:
            typeof row.tags === "string"
              ? row.tags.split(" ").filter(Boolean)
              : row.tags || [],
          priceDisplay:
            row.price_display || `Rs${row.min_price} – Rs${row.max_price}`,
          minPrice: parseFloat(row.min_price) || 500,
          maxPrice: parseFloat(row.max_price) || 2000,
          saleBadge: row.sale_badge,
          inspiredBy: row.inspired_by,
          rating: parseFloat(row.rating) || 4.9,
          reviewsCount: row.reviews_count || 30,
          image: row.image,
          secondaryImage: row.secondary_image,
          description: row.description,
          pyramid: pyramid || {},
          variants: mappedVariants,
          inStock: productInStock,
          in_stock: productInStock,
        };

        return NextResponse.json({ product: formatted }, { headers: noCacheHeaders });
      }
    }
  } catch (err) {
    console.error("Product API error:", err);
  }

  // Fallback to static PRODUCTS
  const staticProd = PRODUCTS.find((p) => p.id === id);
  if (staticProd) {
    const isProdInStock = staticProd.in_stock !== false && staticProd.inStock !== false;
    return NextResponse.json(
      {
        product: {
          ...staticProd,
          inStock: isProdInStock,
          in_stock: isProdInStock,
          variants: (staticProd.variants || []).map((v) => ({
            ...v,
            inStock: isProdInStock && v.inStock !== false && v.in_stock !== false && v.status !== "Out of Stock",
          })),
        },
      },
      { headers: noCacheHeaders }
    );
  }

  return NextResponse.json({ error: "Product not found" }, { status: 404, headers: noCacheHeaders });
}
