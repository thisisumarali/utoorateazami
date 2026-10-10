import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

// GET /api/admin/categories/[id]
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const res = await query(
      `SELECT 
        c.*,
        (SELECT COUNT(*)::int FROM product_categories pc WHERE pc.category_id = c.id) AS product_count
      FROM categories c
      WHERE c.id = $1
      LIMIT 1;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/categories/[id]
export async function PUT(request, { params }) {
  const { id } = await params;
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

    // Check if category exists
    const check = await query("SELECT * FROM categories WHERE id = $1;", [id]);
    if (check.rows.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    const current = check.rows[0];

    // Delete old Cloudinary images if replaced
    if (image !== undefined && image !== current.image && current.image?.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(current.image).catch(() => {});
    }
    if (banner_image !== undefined && banner_image !== current.banner_image && current.banner_image?.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(current.banner_image).catch(() => {});
    }

    const cleanName = name !== undefined ? name.trim() : current.name;
    const newSlug = slug !== undefined
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : current.id;
    const catImage = image !== undefined ? image.trim() : current.image;
    const catBanner = banner_image !== undefined ? banner_image.trim() : current.banner_image;
    const catDesc = description !== undefined ? description.trim() : current.description;
    const catSort = sort_order !== undefined ? parseInt(sort_order, 10) || 1 : current.sort_order;
    const catNav = show_in_nav !== undefined ? show_in_nav : current.show_in_nav;
    const catStatus = status !== undefined ? status : current.status;
    const catMetaTitle = meta_title !== undefined ? meta_title.trim() : current.meta_title;
    const catMetaDesc = meta_description !== undefined ? meta_description.trim() : current.meta_description;

    let finalId = id;

    // If slug has changed, handle updating references
    if (newSlug && newSlug !== id) {
      const conflictCheck = await query("SELECT id FROM categories WHERE id = $1;", [newSlug]);
      if (conflictCheck.rows.length > 0) {
        return NextResponse.json(
          { error: `Slug "${newSlug}" is already in use by another category.` },
          { status: 409 }
        );
      }

      await query(
        `UPDATE categories
         SET id = $1, name = $2, title = $3, description = $4, image = $5,
             banner_image = $6, parent_id = NULL, sort_order = $7, show_in_nav = $8,
             status = $9, meta_title = $10, meta_description = $11, updated_at = NOW()
         WHERE id = $12;`,
        [
          newSlug,
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
          id,
        ]
      );
      finalId = newSlug;

      await query("UPDATE product_categories SET category_id = $1 WHERE category_id = $2;", [newSlug, id]).catch(() => {});
      await query("UPDATE products SET category = $1 WHERE category = $2;", [newSlug, id]).catch(() => {});
    } else {
      await query(
        `UPDATE categories
         SET name = $1, title = $2, description = $3, image = $4,
             banner_image = $5, parent_id = NULL, sort_order = $6, show_in_nav = $7,
             status = $8, meta_title = $9, meta_description = $10, updated_at = NOW()
         WHERE id = $11;`,
        [
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
          id,
        ]
      );
    }

    // Sync legacy utoor_categories
    await query(
      `UPDATE utoor_categories
       SET name = $1, title = $2, subtext = $3, image = $4, parent_id = NULL
       WHERE id = $5;`,
      [cleanName, catDesc, catDesc, catImage, finalId]
    ).catch(() => {});

    // Activity log
    await query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["CATEGORY_UPDATED", `Updated category "${cleanName}" (${finalId})`, "salman@utoorate.com"]
    ).catch(() => {});

    const updated = await query("SELECT * FROM categories WHERE id = $1;", [finalId]);

    return NextResponse.json({
      success: true,
      category: updated.rows[0],
    });
  } catch (err) {
    console.error("Update category error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await query("DELETE FROM product_categories WHERE category_id = $1;", [id]).catch(() => {});

    const res = await query("DELETE FROM categories WHERE id = $1 RETURNING name, image, banner_image;", [id]);
    await query("DELETE FROM utoor_categories WHERE id = $1;", [id]).catch(() => {});

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const cat = res.rows[0];

    // Delete category images from Cloudinary if hosted there
    if (cat.image && cat.image.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(cat.image).catch(() => {});
    }
    if (cat.banner_image && cat.banner_image.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(cat.banner_image).catch(() => {});
    }

    await query(
      `INSERT INTO utoor_activity_logs (action, details, admin_email)
       VALUES ($1, $2, $3);`,
      ["CATEGORY_DELETED", `Deleted category "${cat.name}" (${id})`, "salman@utoorate.com"]
    ).catch(() => {});

    return NextResponse.json({ success: true, message: `Category ${cat.name} deleted` });
  } catch (err) {
    console.error("Delete category error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
