import { Suspense } from "react";
import ShopClient from "./ShopClient";

export const metadata = {
  title: "Shop Complete Fragrance Collection | Utoorat e Azami",
  description:
    "Explore our complete collection of 100% pure alcohol-free artisanal attars, authentic Hindi ouds, designer inspired scents (Zarar, Creed Aventus, Baccarat Rouge), and luxury gift sets.",
  keywords:
    "attar shop, buy attar pakistan, pure oud, zarar inspired, creed aventus inspired, alcohol free attar, baccarat rouge oil",
  openGraph: {
    title: "Shop All Artisanal Fragrances | Utoorat e Azami",
    description:
      "Browse our complete catalog of pure non-alcoholic concentrated perfume oils and royal gift boxes.",
    url: "https://utoorateazami.com/shop",
  },
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#BC8242] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs tracking-widest text-stone-500 uppercase font-serif-luxury">
              Loading Fragrance Collection...
            </span>
          </div>
        </div>
      }
    >
      <ShopClient />
    </Suspense>
  );
}
