"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, X, ShoppingBag } from "lucide-react";
import { PRODUCTS } from "@/data/storeData";

export default function SearchModal({ isOpen, onClose, onSelectProduct }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.categoryDisplay.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        (product.inspiredBy && product.inspiredBy.toLowerCase().includes(query.toLowerCase())) ||
        (product.pyramid && Object.values(product.pyramid).some((note) => note.toLowerCase().includes(query.toLowerCase())));

      const matchesCat =
        selectedCategory === "all" ||
        product.category === selectedCategory ||
        product.tags.includes(selectedCategory);

      return matchesQuery && matchesCat;
    });
  }, [query, selectedCategory]);

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
        <div className="px-5 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider shrink-0">
            Quick Filter:
          </span>
          {[
            { id: "all", label: "All" },
            { id: "mens", label: "Men's" },
            { id: "oud", label: "Oud" },
            { id: "unisex", label: "Unisex" },
            { id: "gift-set", label: "Gift Sets" },
          ].map((cat) => (
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
            filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p);
                  onClose();
                }}
                className="flex items-center gap-4 p-2.5 rounded-xs hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all cursor-pointer group"
              >
                <div className="relative w-14 h-14 bg-[#f7f6f2] rounded-xs overflow-hidden shrink-0 border border-stone-200">
                  <Image src={p.image} alt={p.name} fill sizes="56px" className="object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif-luxury text-sm font-semibold text-stone-900 group-hover:text-[#BC8242] transition-colors truncate uppercase">
                      {p.name}
                    </h4>
                    {p.saleBadge && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#BC8242] text-white font-bold rounded-xs">
                        {p.saleBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500 block truncate">
                    {p.categoryDisplay}
                  </span>
                  {p.inspiredBy && (
                    <span className="text-[10px] text-[#925c24] bg-[#fbf7f0] border border-[#BC8242]/20 px-1.5 py-0.5 rounded-xs inline-block mt-0.5 truncate max-w-full">
                      ✨ {p.inspiredBy}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-stone-900 block">
                    {p.priceDisplay}
                  </span>
                  <span className="text-[10px] text-[#BC8242] font-semibold group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
