"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Sparkles } from "lucide-react";
import { PRODUCTS } from "@/data/storeData";

export default function SearchModal({ isOpen, onClose, onSelectProduct }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState(PRODUCTS);
  const [categories, setCategories] = useState([
    { id: "all", label: "All" },
    { id: "mens", label: "Men's" },
    { id: "oud", label: "Oud" },
    { id: "unisex", label: "Unisex" },
    { id: "gift-set", label: "Gift Sets" },
    { id: "azamis-special", label: "Azamis Special" },
  ]);

  // Fetch live products & categories whenever search modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadLiveData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (isMounted && Array.isArray(prodData.products) && prodData.products.length > 0) {
            setProducts(prodData.products);
          }
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          const cats = catData.categories || catData.mainCategories;
          if (isMounted && Array.isArray(cats) && cats.length > 0) {
            const dynamicTabs = [{ id: "all", label: "All" }];
            cats.forEach((c) => {
              dynamicTabs.push({ id: c.id, label: c.name });
            });
            setCategories(dynamicTabs);
          }
        }
      } catch (err) {
        // Fallback to initial state
      }
    }

    loadLiveData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const catDisplay = (product.category_display || product.categoryDisplay || "").toLowerCase();
      const desc = (product.description || "").toLowerCase();
      const inspired = (product.inspired_by || product.inspiredBy || "").toLowerCase();

      let pyramidNotes = "";
      if (product.pyramid) {
        if (typeof product.pyramid === "object") {
          pyramidNotes = Object.values(product.pyramid).filter((v) => typeof v === "string").join(" ").toLowerCase();
        } else if (typeof product.pyramid === "string") {
          pyramidNotes = product.pyramid.toLowerCase();
        }
      }

      const matchesQuery =
        !q ||
        name.includes(q) ||
        catDisplay.includes(q) ||
        desc.includes(q) ||
        inspired.includes(q) ||
        pyramidNotes.includes(q);

      const pCat = (product.category || "").toLowerCase();
      const pTags = Array.isArray(product.tags)
        ? product.tags.map((t) => String(t).toLowerCase())
        : typeof product.tags === "string"
        ? product.tags.toLowerCase().split(" ")
        : [];
      const pCatIds = Array.isArray(product.category_ids)
        ? product.category_ids.map((c) => String(c).toLowerCase())
        : [];

      const targetCat = selectedCategory.toLowerCase();
      const matchesCat =
        selectedCategory === "all" ||
        pCat === targetCat ||
        pTags.includes(targetCat) ||
        pCatIds.includes(targetCat);

      return matchesQuery && matchesCat;
    });
  }, [query, selectedCategory, products]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xs max-w-2xl w-full overflow-hidden shadow-2xl z-10 border border-stone-200">
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center gap-3 bg-stone-50">
          <Search size={20} className="text-[#BC8242] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search perfumes, attars, ouds (e.g. Silver Oud, Janan)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-stone-400 hover:text-stone-600 text-xs px-2"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Filter Tags */}
        <div className="px-5 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider shrink-0">
            Quick Filter:
          </span>
          {categories.slice(0, 7).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-colors shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-[#BC8242] text-white"
                  : "bg-white text-stone-700 hover:bg-stone-200 border border-stone-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-stone-500">
              <p className="text-sm">No fragrances found matching &quot;{query}&quot;.</p>
              <p className="text-xs text-stone-400 mt-1">Try searching for &quot;Oud&quot;, &quot;Janan&quot;, or &quot;Gift Set&quot;.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const saleBadge = p.sale_badge || p.saleBadge;
              const inspiredBy = p.inspired_by || p.inspiredBy;
              const categoryDisplay = p.category_display || p.categoryDisplay || "Attar";
              let min = parseFloat(p.min_price || p.minPrice) || 0;
              let max = parseFloat(p.max_price || p.maxPrice) || min;
              if (Array.isArray(p.variants) && p.variants.length > 0) {
                const prs = p.variants.map((v) => parseFloat(v.price) || 0).filter((pr) => pr > 0);
                if (prs.length > 0) {
                  min = Math.min(...prs);
                  max = Math.max(...prs);
                }
              }
              const priceDisplay = min > 0
                ? min === max
                  ? `Rs${min.toLocaleString()}`
                  : `Rs${min.toLocaleString()} – Rs${max.toLocaleString()}`
                : (p.price_display || "Rs500 – Rs2,000");

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (onSelectProduct) onSelectProduct(p);
                    router.push(`/product/${p.id}`);
                    onClose();
                  }}
                  className="flex items-center gap-4 p-2.5 rounded-xs hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all cursor-pointer group"
                >
                  <div className="relative w-14 h-14 bg-[#f7f6f2] rounded-xs overflow-hidden shrink-0 border border-stone-200">
                    <Image
                      src={p.image || "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png"}
                      alt={p.name}
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif-luxury text-sm font-semibold text-stone-900 group-hover:text-[#BC8242] transition-colors truncate uppercase">
                        {p.name}
                      </h4>
                      {saleBadge && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#BC8242] text-white font-bold rounded-xs">
                          {saleBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-500 block truncate">
                      {categoryDisplay}
                    </span>
                    {inspiredBy && (
                      <span className="text-[10px] text-[#925c24] bg-[#fbf7f0] border border-[#BC8242]/20 px-1.5 py-0.5 rounded-xs inline-block mt-0.5 truncate max-w-full">
                        ✨ {inspiredBy}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-stone-900 block">
                      {priceDisplay}
                    </span>
                    <span className="text-[10px] text-[#BC8242] font-semibold group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
