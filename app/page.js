"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import SectionHeader from "@/components/SectionHeader";
import ProductCard from "@/components/ProductCard";
import CategoryShowcase from "@/components/CategoryShowcase";
import TrustBadges from "@/components/TrustBadges";
import Footer from "@/components/Footer";
import { PRODUCTS, TESTIMONIALS, SITE_CONFIG } from "@/data/storeData";
import { useCart } from "@/context/CartContext";
import { Star, Gift, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { addToCart, setQuickViewProduct } = useCart();
  const [activeCategory, setActiveCategory] = useState("all");

  // Azamis Special (4 spotlight products for top row)
  const azamisSpecial = useMemo(() => {
    return PRODUCTS.filter((p) => p.tags.includes("azamis-special")).slice(0, 4);
  }, []);

  // Filtered Catalog products
  const filteredCatalog = useMemo(() => {
    if (activeCategory === "all") return PRODUCTS;
    if (activeCategory === "azamis-special") {
      return PRODUCTS.filter((p) => p.tags.includes("azamis-special"));
    }
    if (activeCategory === "best-seller") {
      return PRODUCTS.filter((p) => p.tags.includes("best-seller"));
    }
    return PRODUCTS.filter(
      (p) =>
        p.category === activeCategory ||
        p.tags.includes(activeCategory)
    );
  }, [activeCategory]);

  const scrollToTarget = (targetId) => {
    if (targetId.startsWith("#")) {
      const el = document.querySelector(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else if (targetId.startsWith("/")) {
      router.push(targetId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Main Navbar */}
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const sec = document.getElementById("catalog-section");
          if (sec) sec.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <main className="flex-1">
        {/* 1. Hero Slider with background images sliding */}
        <HeroSlider onExploreClick={scrollToTarget} />

        {/* 2. AZAMIS SPECIAL SECTION */}
        <section id="azamis-special" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          {/* Centered Divider Title flanked by thin lines */}
          <SectionHeader title="AZAMIS SPECIAL" />

          {/* 4 Clean Minimalist Product Cards in a row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {azamisSpecial.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </section>

        {/* 3. BROWSE OUR CATEGORIES SECTION - matching user reference divider */}
        <section id="categories" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 bg-stone-50/50 rounded-xs my-4 sm:my-6">
          <SectionHeader title="BROWSE OUR CATEGORIES" />
          <CategoryShowcase
            onSelectCategory={(catId) => {
              setActiveCategory(catId);
              const sec = document.getElementById("catalog-section");
              if (sec) sec.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </section>

        {/* 4. FULL CATALOG & BEST SELLERS WITH FILTER TABS */}
        <section id="catalog-section" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
          <SectionHeader
            title="OUR ARTISANAL COLLECTION"
            subtitle="100% Pure Non-Alcoholic Perfume Oils"
          />

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-10 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            {[
              { id: "all", label: "All Fragrances" },
              { id: "best-seller", label: "Best Sellers" },
              { id: "azamis-special", label: "Azamis Special" },
              { id: "mens", label: "Men's Attars" },
              { id: "oud", label: "Pure Oud" },
              { id: "unisex", label: "Unisex" },
              { id: "gift-set", label: "Gift Sets" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 ${
                  activeCategory === tab.id
                    ? "bg-[#BC8242] text-white shadow-sm"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product Grid - Max 8 Products */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {filteredCatalog.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>

          {/* Explore Full Shop CTA */}
          <div className="mt-10 sm:mt-14 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-stone-900 hover:bg-[#BC8242] active:bg-[#925c24] text-white text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xs transition-all shadow-md group"
            >
              <span>Explore Complete Shop</span>
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </section>

        {/* 5. LUXURY GIFT SET SPOTLIGHT */}
        <section id="gift-sets" className="bg-[#faf7f2] border-y border-stone-200 py-14 md:py-20 my-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Image Showcase */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-[4/5] bg-white rounded-xs overflow-hidden border border-stone-200 shadow-md p-4 flex items-center justify-center group">
                  <Image
                    src="https://utoorateazami.com/wp-content/uploads/2024/03/shamekh-gs-min-600x800-1-300x300.png"
                    alt="Shamekh Gift Set"
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                    className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#BC8242] text-white text-[10px] font-bold uppercase rounded-xs">
                    7% OFF
                  </span>
                </div>
                <div className="relative aspect-[4/5] bg-white rounded-xs overflow-hidden border border-stone-200 shadow-md p-4 flex items-center justify-center group">
                  <Image
                    src="https://utoorateazami.com/wp-content/uploads/2024/03/BIDUN-ESAM-GIFT-SET-600x759-1-300x300.png"
                    alt="Bidun Esam Gift Set"
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                    className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#BC8242] text-white text-[10px] font-bold uppercase rounded-xs">
                    7% OFF
                  </span>
                </div>
              </div>

              {/* Text & Feature Description */}
              <div className="space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2e6d6] text-[#8e5c26] text-xs uppercase font-bold tracking-widest">
                  <Gift size={14} /> Royal Presentation Keepsakes
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif-luxury font-bold text-stone-900 leading-tight">
                  Artisanal Gift Sets Crafted For Celebrations
                </h2>
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                  Presented in gold-embossed velvet caskets, our signature gift sets unite four revered attar flacons. Whether honoring weddings, Eid, or corporate milestones, give the enduring gift of oriental majesty.
                </p>

                <div className="space-y-3 py-2 text-xs sm:text-sm text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BC8242]"></span>
                    <span>Includes 4 x 12ml concentrated crystal flacons with gold dipsticks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BC8242]"></span>
                    <span>Rigid keepsake presentation box with velvet lining</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BC8242]"></span>
                    <span>Complimentary personalized gift message on request</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={() => {
                      const shamekh = PRODUCTS.find((p) => p.id === "shamekh-gift-set");
                      if (shamekh) setQuickViewProduct(shamekh);
                    }}
                    className="px-6 py-3 rounded-full bg-[#BC8242] hover:bg-[#a36b2f] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md flex items-center gap-2"
                  >
                    View Shamekh Set (Rs9,765) <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const bidun = PRODUCTS.find((p) => p.id === "bidun-esam-gift-set");
                      if (bidun) setQuickViewProduct(bidun);
                    }}
                    className="px-6 py-3 rounded-full border border-stone-800 text-stone-900 hover:bg-stone-900 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    View Bidun Esam Set
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. ABOUT OUR HOUSE / BRAND STORY */}
        <section id="about" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center space-y-6">
          <span className="text-xs uppercase tracking-[0.25em] text-[#BC8242] font-semibold block">
            THE HERITAGE OF عطور الأعظمي
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif-luxury font-bold text-stone-900">
            Crafting Purity, Tradition & Elegance
          </h2>
          <div className="w-16 h-0.5 bg-[#BC8242] mx-auto"></div>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-3xl mx-auto">
            At Utoorat e Azami, we believe fragrance is an intimate spiritual signature. We shun synthetic dilution, offering 100% non-alcoholic, skin-friendly concentrated perfume oils created through age-old maceration and distillation methods. From rare Hindi Dehn Al Oud to luminous White Musk and exquisite Taif Rose, every drop is an ode to timeless refinement.
          </p>
        </section>

        {/* 7. CUSTOMER TESTIMONIALS */}
        <section className="bg-stone-50/70 border-t border-stone-200 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="WHAT CUSTOMERS SAY"
              subtitle="Voices of Connoisseurs"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-6 rounded-xs border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} size={15} className="fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-stone-900 block">{t.name}</strong>
                      <span className="text-stone-500">{t.city}, Pakistan</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#8e5c26] text-[10px] font-semibold border border-amber-200/60">
                      Verified Purchase
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. TRUST BADGES */}
        <TrustBadges />
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const sec = document.getElementById("catalog-section");
          if (sec) sec.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </div>
  );
}
