import { notFound } from "next/navigation";
import { PRODUCTS, SITE_CONFIG } from "@/data/storeData";
import ProductDetailClient from "./ProductDetailClient";

// Pre-render all products at build time
export function generateStaticParams() {
  return PRODUCTS.map((product) => ({
    id: product.id,
  }));
}

// Dynamic SEO metadata per product
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);

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
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  // Find up to 4 related products sharing category or tags
  const otherProducts = PRODUCTS.filter((p) => p.id !== product.id);
  const matchingProducts = otherProducts.filter((p) => {
    const sharesCategory = p.category === product.category;
    const sharesTag = p.tags && product.tags && p.tags.some((t) => product.tags.includes(t));
    return sharesCategory || sharesTag;
  });

  // Fill up to 4 products if matching ones are fewer
  const relatedProducts = [...matchingProducts];
  for (const p of otherProducts) {
    if (relatedProducts.length >= 4) break;
    if (!relatedProducts.some((r) => r.id === p.id)) {
      relatedProducts.push(p);
    }
  }

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts.slice(0, 4)}
    />
  );
}
