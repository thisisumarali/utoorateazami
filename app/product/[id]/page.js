import { notFound } from "next/navigation";
import { PRODUCTS, SITE_CONFIG } from "@/data/storeData";
import ProductDetailClient from "./ProductDetailClient";
import { query, testDbConnection } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Pre-render all products at build time
export function generateStaticParams() {
  return PRODUCTS.map((product) => ({
    id: product.id,
  }));
}

async function getProduct(id) {
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

        return {
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
      }
    }
  } catch (e) {
    // Ignore and fallback to static
  }

  const staticProd = PRODUCTS.find((p) => p.id === id);
  if (staticProd) {
    const isProdInStock = staticProd.in_stock !== false && staticProd.inStock !== false;
    return {
      ...staticProd,
      inStock: isProdInStock,
      in_stock: isProdInStock,
      variants: (staticProd.variants || []).map((v) => ({
        ...v,
        inStock: isProdInStock && v.inStock !== false && v.in_stock !== false && v.status !== "Out of Stock",
      })),
    };
  }
  return null;
}

async function getRelatedProducts(product) {
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
        WHERE p.id != $1
        ORDER BY 
          CASE WHEN p.category = $2 THEN 0 ELSE 1 END,
          p.in_stock DESC,
          p.rating DESC
        LIMIT 4;`,
        [product.id, product.category || ""]
      );

      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          categoryDisplay: row.category_display || row.category,
          priceDisplay: row.price_display || `Rs${row.min_price} – Rs${row.max_price}`,
          minPrice: parseFloat(row.min_price) || 500,
          maxPrice: parseFloat(row.max_price) || 2000,
          saleBadge: row.sale_badge,
          inspiredBy: row.inspired_by,
          image: row.image,
          inStock: row.in_stock !== false,
          in_stock: row.in_stock !== false,
          variants: typeof row.variants === "string" ? JSON.parse(row.variants) : row.variants || [],
        }));
      }
    }
  } catch (e) {
    // Fallback below
  }

  // Fallback to static
  const otherProducts = PRODUCTS.filter((p) => p.id !== product.id);
  const matchingProducts = otherProducts.filter((p) => {
    const sharesCategory = p.category === product.category;
    const sharesTag =
      p.tags &&
      product.tags &&
      Array.isArray(product.tags) &&
      p.tags.some((t) => product.tags.includes(t));
    return sharesCategory || sharesTag;
  });

  const related = [...matchingProducts];
  for (const p of otherProducts) {
    if (related.length >= 4) break;
    if (!related.some((r) => r.id === p.id)) {
      related.push(p);
    }
  }
  return related.slice(0, 4);
}

// Dynamic SEO metadata per product
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | Utoorat e Azami",
    };
  }

  return {
    title: `${product.name} - Pure Concentrated Attar | Utoorat e Azami`,
    description: product.description,
    keywords: `${product.name}, attar, perfume oil, udoorateazami, pure oud, ${product.categoryDisplay}`,
    openGraph: {
      title: `${product.name} | Utoorat e Azami Artisanal Attar`,
      description: product.description,
      url: `https://utoorateazami.com/product/${product.id}`,
      images: [
        {
          url: product.image,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
