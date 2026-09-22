"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { PRODUCTS } from "@/data/storeData";
import { useCart } from "@/context/CartContext";
import {
  Search,
  X,
  ChevronRight,
  ShieldCheck,
  Clock,
  Truck,
  Banknote,
  ArrowUpDown,
} from "lucide-react";

export default function ShopClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const initialCategory = searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState("featured");

  // Keep state in sync with URL searchParams
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat);
    }
    const q = searchParams.get("q");
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Clean, focused category tabs
  const categoryFilters = [
    { id: "all", label: "All Fragrances" },
    { id: "azamis-special", label: "Azamis Special" },
    { id: "mens", label: "Men's" },
    { id: "oud", label: "Oud Collection" },
    { id: "unisex", label: "Unisex" },
    { id: "gift-set", label: "Gift Sets" },
  ];

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      // Category filter
      if (activeCategory !== "all") {
        const matchesCategory =
          p.category === activeCategory ||
          (p.tags && p.tags.includes(activeCategory));
        if (!matchesCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = p.name.toLowerCase().includes(q);
        const inCat = p.categoryDisplay.toLowerCase().includes(q);
        const inInspired =
          p.inspiredBy && p.inspiredBy.toLowerCase().includes(q);
        if (!inName && !inCat && !inInspired) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.minPrice - b.minPrice;
      if (sortBy === "price-desc") return b.minPrice - a.minPrice;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0; // default featured
    });
  }, [activeCategory, searchQuery, sortBy]);

  const handleSelectCategory = (id) => {
    setActiveCategory(id);
    if (id === "all") {
      router.replace("/shop");
    } else {
      router.replace(`/shop?category=${id}`);
    }
  };

  const handleClearFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
    setSortBy("featured");
    router.replace("/shop");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900">
      {/* Universal Navbar */}
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Luxury Minimal Hero Banner */}
      <section className="bg-[#1c1917] text-white py-10 sm:py-14 text-center border-b border-[#BC8242]/30 px-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-[11px] text-stone-400 uppercase tracking-widest">
            <Link href="/" className="hover:text-[#BC8242] transition-colors">
              Home
            </Link>
            <ChevronRight size={12} className="text-[#BC8242]" />
            <span className="text-white font-semibold">Shop</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif-luxury font-bold tracking-wider uppercase text-white">
            The Complete Collection
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 font-light max-w-xl mx-auto leading-relaxed">
            100% pure alcohol-free concentrated perfume oils, authentic Hindi ouds, and royal oriental gift sets.
          </p>

          {/* Key Trust Points */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-xs text-stone-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#BC8242]" /> 100% Non-Alcoholic
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#BC8242]" /> 24h Longevity
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-[#BC8242]" /> Free Shipping Over Rs. 3,000
            </span>
            <span className="flex items-center gap-1.5">
              <Banknote size={14} className="text-[#BC8242]" /> Cash On Delivery
            </span>
          </div>
        </div>
      </section>

      {/* Main Shop Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Simple & Clean Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoryFilters.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-[#BC8242] text-white shadow-xs"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box & Sort Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Search perfumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-stone-50 border border-stone-300 rounded-full text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#BC8242] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-stone-300 rounded-full py-1.5 px-3 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#BC8242] cursor-pointer shadow-2xs"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Count & Clear Filter Indicator */}
        <div className="flex items-center justify-between py-3 text-xs text-stone-500">
          <span>
            Showing <strong className="text-stone-900">{filteredProducts.length}</strong> fragrances
          </span>

          {(activeCategory !== "all" || searchQuery !== "" || sortBy !== "featured") && (
            <button
              onClick={handleClearFilters}
              className="text-[#BC8242] hover:text-[#925c24] font-semibold text-xs transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Product Grid Showcase */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto space-y-3">
            <p className="text-sm text-stone-600 font-medium">
              No fragrances found matching your search.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2 bg-stone-900 text-white rounded-full text-xs font-semibold hover:bg-[#BC8242] transition-colors"
            >
              Show All Fragrances
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(item) => addToCart(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Universal Footer */}
      <Footer onSelectCategory={handleSelectCategory} />
    </div>
  );
}
