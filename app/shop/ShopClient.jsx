"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  RotateCcw,
} from "lucide-react";

// Helper to determine product stock availability
function checkProductStock(product) {
  if (product.in_stock === false || product.inStock === false) return false;
  let variants = product.variants;
  if (typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch (e) {
      variants = null;
    }
  }
  if (Array.isArray(variants) && variants.length > 0) {
    return variants.some((v) => {
      if (!v) return false;
      if (v.inStock === false || v.in_stock === false) return false;
      if (v.status === "Out of Stock" || v.status === "out_of_stock") return false;
      return true;
    });
  }
  return true;
}

export default function ShopClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const initialCategory = searchParams.get("category") || "all";
  const initialStock = searchParams.get("stock") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [stockFilter, setStockFilter] = useState(initialStock);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(initialQuery));
  const [sortBy, setSortBy] = useState("featured");

  const searchInputRef = useRef(null);

  // Dynamic API state with instant static fallback
  const [dbProducts, setDbProducts] = useState(null);
  const [dbCategories, setDbCategories] = useState(null);

  // Fetch from PostgreSQL DB if available
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (isMounted) {
          if (catData.categories && catData.categories.length > 0) {
            setDbCategories(catData.categories);
          } else if (catData.mainCategories && catData.mainCategories.length > 0) {
            setDbCategories(catData.mainCategories);
          }

          if (prodData.products && prodData.products.length > 0) {
            setDbProducts(prodData.products);
          }
        }
      } catch (err) {
        // Fallback silently to static data on GitHub / live without APIs
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep state in sync with URL searchParams
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat);
    } else if (!cat && activeCategory !== "all") {
      setActiveCategory("all");
    }

    const stock = searchParams.get("stock");
    if (stock && stock !== stockFilter) {
      setStockFilter(stock);
    } else if (!stock && stockFilter !== "all") {
      setStockFilter("all");
    }

    const q = searchParams.get("q");
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Clean, focused category tabs
  const defaultCategoryFilters = [
    { id: "all", label: "All Fragrances" },
    { id: "mens", label: "Men's" },
    { id: "oud", label: "Oud" },
    { id: "unisex", label: "Unisex" },
    { id: "gift-set", label: "Gift Sets" },
    { id: "womens", label: "Women's" },
    { id: "azamis-special", label: "Azamis Special" },
  ];

  const categoryFilters = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) return defaultCategoryFilters;
    const items = [{ id: "all", label: "All Fragrances" }];
    dbCategories.forEach((c) => {
      if (!items.some((it) => it.id === c.id)) {
        items.push({ id: c.id, label: c.name });
      }
    });
    return items;
  }, [dbCategories]);

  // Active product dataset: DB products if loaded, otherwise static PRODUCTS
  const allProducts = useMemo(() => {
    return dbProducts && dbProducts.length > 0 ? dbProducts : PRODUCTS;
  }, [dbProducts]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        // Category filter
        if (activeCategory !== "all") {
          const pCat = (p.category || "").toLowerCase();
          const pTags = Array.isArray(p.tags)
            ? p.tags.map((t) => String(t).toLowerCase())
            : [];
          const pCatIds = Array.isArray(p.category_ids)
            ? p.category_ids.map((c) => String(c).toLowerCase())
            : [];
          const target = activeCategory.toLowerCase();

          const matchesCategory =
            pCat === target ||
            pTags.includes(target) ||
            pCatIds.includes(target);
          if (!matchesCategory) return false;
        }

        // Stock filter
        if (stockFilter === "in_stock" || stockFilter === "in") {
          if (!checkProductStock(p)) return false;
        } else if (stockFilter === "out_of_stock" || stockFilter === "out") {
          if (checkProductStock(p)) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const inName = (p.name || "").toLowerCase().includes(q);
          const inCat = (p.category_display || p.categoryDisplay || "")
            .toLowerCase()
            .includes(q);
          const inInspired = (p.inspired_by || p.inspiredBy || "")
            .toLowerCase()
            .includes(q);
          if (!inName && !inCat && !inInspired) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Stock priority: In-stock products ALWAYS appear first (1st and 2nd rows)
        const stockA = checkProductStock(a) ? 1 : 0;
        const stockB = checkProductStock(b) ? 1 : 0;
        if (stockA !== stockB) return stockB - stockA;

        const minA = a.min_price !== undefined ? a.min_price : (a.minPrice || 0);
        const minB = b.min_price !== undefined ? b.min_price : (b.minPrice || 0);
        const ratA = a.rating || 5;
        const ratB = b.rating || 5;

        if (sortBy === "price-asc") return minA - minB;
        if (sortBy === "price-desc") return minB - minA;
        if (sortBy === "rating") return ratB - ratA;
        return 0; // default featured
      });
  }, [allProducts, activeCategory, stockFilter, searchQuery, sortBy]);

  const handleSelectCategory = (id) => {
    setActiveCategory(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("category");
    } else {
      params.set("category", id);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/shop${query}`);
  };

  const handleSelectStock = (status) => {
    setStockFilter(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("stock");
    } else {
      params.set("stock", status);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/shop${query}`);
  };

  const handleClearFilters = () => {
    setActiveCategory("all");
    setStockFilter("all");
    setSearchQuery("");
    setIsSearchOpen(false);
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
        {/* Simple & Clean Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap sm:flex-nowrap">
            {categoryFilters.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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

          {/* Action Controls: Search Icon Button / Input + Dropdowns */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-end lg:self-auto">
            {/* Clickable Search Icon Button or Expanded Search Input */}
            {isSearchOpen || searchQuery ? (
              <div className="relative flex items-center">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search perfumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-44 sm:w-56 pl-8 pr-7 py-1.5 bg-white border border-stone-300 rounded-full text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#BC8242] shadow-2xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                  title="Close search"
                  aria-label="Close search"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="w-8 h-8 rounded-full border border-stone-300 bg-white hover:bg-stone-100 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Search fragrances"
                aria-label="Search fragrances"
              >
                <Search size={15} />
              </button>
            )}

            {/* Stock Availability Dropdown */}
            <div className="flex items-center gap-1 shrink-0">
              <select
                value={stockFilter}
                onChange={(e) => handleSelectStock(e.target.value)}
                className="bg-white border border-stone-300 rounded-full py-1.5 px-3 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#BC8242] cursor-pointer shadow-2xs"
                aria-label="Filter by availability"
              >
                <option value="all">All</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
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

          {(activeCategory !== "all" || stockFilter !== "all" || searchQuery !== "" || sortBy !== "featured") && (
            <button
              onClick={handleClearFilters}
              className="text-[#BC8242] hover:text-[#925c24] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Clear filters</span>
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
              className="px-5 py-2 bg-stone-900 text-white rounded-full text-xs font-semibold hover:bg-[#BC8242] transition-colors cursor-pointer"
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
