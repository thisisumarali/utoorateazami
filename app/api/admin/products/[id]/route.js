import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

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
    const res = await query(
      `SELECT 
        p.*,
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
      WHERE p.id = $1
      GROUP BY p.id
      LIMIT 1;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404, headers: noCacheHeaders });
    }

    return NextResponse.json({ product: res.rows[0] }, { headers: noCacheHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: noCacheHeaders });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      name,
      category,
      category_display,
      tags,
      min_price,
      max_price,
      price_display,
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

    // Fetch existing product to compare images
    const currentRes = await query("SELECT image, secondary_image FROM products WHERE id = $1 LIMIT 1;", [id]);
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const current = currentRes.rows[0];

    // If image is being replaced with a different image and old image is on Cloudinary, delete old one
    if (image !== undefined && image !== current.image && current.image?.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(current.image).catch(() => {});
    }

    // If secondary_image is being replaced and old is on Cloudinary, delete old one
    if (secondary_image !== undefined && secondary_image !== current.secondary_image && current.secondary_image?.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(current.secondary_image).catch(() => {});
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      values.push(name.toUpperCase());
      fields.push(`name = $${values.length}`);
    }
    if (category !== undefined) {
      values.push(category);
      fields.push(`category = $${values.length}`);
    }
    if (category_display !== undefined) {
      values.push(category_display);
      fields.push(`category_display = $${values.length}`);
    }
    if (tags !== undefined) {
      values.push(JSON.stringify(tags));
      fields.push(`tags = $${values.length}`);
    }
    if (min_price !== undefined) {
      values.push(min_price);
      fields.push(`min_price = $${values.length}`);
    }
    if (max_price !== undefined) {
      values.push(max_price);
      fields.push(`max_price = $${values.length}`);
    }
    if (price_display !== undefined) {
      values.push(price_display);
      fields.push(`price_display = $${values.length}`);
    }
    if (sale_badge !== undefined) {
      values.push(sale_badge);
      fields.push(`sale_badge = $${values.length}`);
    }
    if (inspired_by !== undefined) {
      values.push(inspired_by);
      fields.push(`inspired_by = $${values.length}`);
    }
    if (image !== undefined) {
      values.push(image);
      fields.push(`image = $${values.length}`);
    }
    if (secondary_image !== undefined) {
      values.push(secondary_image);
      fields.push(`secondary_image = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description);
      fields.push(`description = $${values.length}`);
    }
    if (pyramid !== undefined) {
      values.push(JSON.stringify(pyramid));
      fields.push(`pyramid = $${values.length}`);
    }
    if (variants !== undefined) {
      values.push(JSON.stringify(variants));
      fields.push(`variants = $${values.length}`);
    }
    if (in_stock !== undefined) {
      values.push(in_stock);
      fields.push(`in_stock = $${values.length}`);
    }

    let updatedProduct = null;

    if (fields.length > 0) {
      fields.push("updated_at = NOW()");
      values.push(id);

      const updateSql = `
        UPDATE products
        SET ${fields.join(", ")}
        WHERE id = $${values.length}
        RETURNING *;
      `;

      const res = await query(updateSql, values);

      // Also update utoor_products
      await query(
        `UPDATE utoor_products SET ${fields.join(", ")} WHERE id = $${values.length};`,
        values
      ).catch(() => {});

      if (res.rows.length === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      updatedProduct = res.rows[0];
    } else {
      const existing = await query("SELECT * FROM products WHERE id = $1 LIMIT 1;", [id]);
      updatedProduct = existing.rows[0];
    }

    // Update product_categories relationships if provided
    if (Array.isArray(category_ids)) {
      await query("DELETE FROM product_categories WHERE product_id = $1;", [id]);
      for (const catId of category_ids) {
        await query(
          `INSERT INTO product_categories (product_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT (product_id, category_id) DO NOTHING;`,
          [id, catId]
        ).catch(() => {});
      }
    }

    // Log update
    await query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["PRODUCT_UPDATED", `Updated fragrance "${updatedProduct.name}" (${id})`, "salman@utoorate.com"]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      product: {
        ...updatedProduct,
        category_ids: category_ids || [],
      },
    });
  } catch (err) {
    console.error("Product update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const res = await query(
      "DELETE FROM products WHERE id = $1 RETURNING name, image, secondary_image;",
      [id]
    );

    await query("DELETE FROM utoor_products WHERE id = $1;", [id]).catch(() => {});

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const prod = res.rows[0];

    // Delete product images from Cloudinary if hosted there
    if (prod.image && prod.image.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(prod.image).catch(() => {});
    }
    if (prod.secondary_image && prod.secondary_image.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(prod.secondary_image).catch(() => {});
    }

    await query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["PRODUCT_DELETED", `Deleted product "${prod.name}" (${id})`, "salman@utoorate.com"]
    ).catch(() => {});

    return NextResponse.json({ success: true, message: `Product ${prod.name} deleted` });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
