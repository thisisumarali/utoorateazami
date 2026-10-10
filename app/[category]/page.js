import { redirect } from "next/navigation";

export async function generateMetadata({ params }) {
  const { category } = await params;
  const formatted = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${formatted} Fragrances | Utoorat e Azami`,
    description: `Explore artisanal non-alcoholic concentrated perfume oils and fragrances in ${formatted}.`,
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  redirect(`/shop?category=${encodeURIComponent(category)}`);
}
