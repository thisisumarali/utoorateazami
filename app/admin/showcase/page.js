"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Save,
  ExternalLink,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ChevronRight,
} from "lucide-react";

const PRESET_TITLES = [
  "AZAMIS SPECIAL",
  "EID SPECIAL",
  "RAMADAN SPECIAL",
  "BEST SELLERS",
  "ROYAL ATTARS",
  "FESTIVE COLLECTION",
  "LIMITED EDITIONS",
];

const DEFAULT_SLOT_COUNT = 8;

export default function AdminShowcasePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Showcase form state
  const [title, setTitle] = useState("AZAMIS SPECIAL");
  const [subtitle, setSubtitle] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  // All catalog products for selection
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Modal State for Picking a Product for a Slot
  const [pickerSlotIndex, setPickerSlotIndex] = useState(null); // 0 to 7
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Load current showcase settings and catalog products
  useEffect(() => {
    async function loadShowcaseData() {
      setLoading(true);
      try {
        const [showcaseRes, prodRes] = await Promise.all([
          fetch("/api/admin/showcase"),
          fetch("/api/admin/products"),
        ]);

        const showcaseData = await showcaseRes.json();
        const prodData = await prodRes.json();

        if (prodData && Array.isArray(prodData.products)) {
          setAllProducts(prodData.products);
        }

        if (showcaseData) {
          const loadedTitle = showcaseData.title || "AZAMIS SPECIAL";
          const loadedSubtitle = showcaseData.subtitle || "";
          const loadedIds = Array.isArray(showcaseData.product_ids)
            ? showcaseData.product_ids
            : [];

          setTitle(loadedTitle);
          setSubtitle(loadedSubtitle);
          setSelectedIds(loadedIds);

          setSavedSnapshot(
            JSON.stringify({
              title: loadedTitle,
              subtitle: loadedSubtitle,
              ids: loadedIds,
            })
          );
        }
      } catch (err) {
        console.error("Failed to load showcase data:", err);
        setErrorMessage("Failed to load showcase settings from database.");
      } finally {
        setLoading(false);
        setProductsLoading(false);
      }
    }

    loadShowcaseData();
  }, []);

  // Map of all products by ID for fast lookup
  const productMap = useMemo(() => {
    const map = new Map();
    allProducts.forEach((p) => {
      map.set(p.id, p);
    });
    return map;
  }, [allProducts]);

  // Categories list for filter in selector modal
  const categoriesList = useMemo(() => {
    const set = new Set();
    allProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [allProducts]);

  // Check if form has unsaved modifications
  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    const current = JSON.stringify({
      title: title.trim(),
      subtitle: subtitle.trim(),
      ids: selectedIds,
    });
    return current !== savedSnapshot;
  }, [title, subtitle, selectedIds, savedSnapshot]);

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      // Filter out empty IDs and limit to 8
      const cleanIds = selectedIds.filter(Boolean).slice(0, DEFAULT_SLOT_COUNT);

      const res = await fetch("/api/admin/showcase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "AZAMIS SPECIAL",
          subtitle: subtitle.trim(),
          product_ids: cleanIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update showcase");
      }

      setSavedSnapshot(
        JSON.stringify({
          title: title.trim() || "AZAMIS SPECIAL",
          subtitle: subtitle.trim(),
          ids: cleanIds,
        })
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err) {
      console.error("Save error:", err);
      setErrorMessage(err.message || "Failed to save showcase settings.");
    } finally {
      setSaving(false);
    }
  };

  // Reordering slots
  const handleMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= DEFAULT_SLOT_COUNT) return;
    const next = [...selectedIds];
    // Ensure array has enough elements
    while (next.length < DEFAULT_SLOT_COUNT) next.push(null);

    const temp = next[fromIndex];
    next[fromIndex] = next[toIndex];
    next[toIndex] = temp;
    setSelectedIds(next);
  };

  // Removing a slot
  const handleRemove = (slotIndex) => {
    const next = [...selectedIds];
    next.splice(slotIndex, 1);
    setSelectedIds(next);
  };

  // Selecting a product for a slot
  const handleSelectProduct = (productId) => {
    if (pickerSlotIndex === null) return;
    const next = [...selectedIds];
    // Fill gaps if any
    while (next.length <= pickerSlotIndex) {
      next.push(null);
    }
    next[pickerSlotIndex] = productId;
    setSelectedIds(next);
    setPickerSlotIndex(null);
  };

  // Filtered products for modal
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (inStockOnly && !p.in_stock) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchInsp = (p.inspired_by || "").toLowerCase().includes(q);
        const matchCat = (p.category_display || "").toLowerCase().includes(q);
        return matchName || matchInsp || matchCat;
      }
      return true;
    });
  }, [allProducts, searchQuery, categoryFilter, inStockOnly]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 text-[#BC8242] rounded-xl border border-amber-200/60">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Homepage Showcase (8 Products)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage the featured spotlight section on your homepage. Customize the section title and select exactly 8 products to display.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/#azamis-special"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors shadow-2xs"
          >
            <ExternalLink size={16} />
            <span>View on Website</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-amber-300 font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{saving ? "Saving..." : "Save Showcase"}</span>
          </button>
        </div>
      </div>

      {/* 2. Notifications & Alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>
            Showcase updated successfully! The new heading and 8 products are now live on your homepage.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium animate-fadeIn">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isDirty && !saveSuccess && (
        <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-[#BC8242] shrink-0" />
            <span>You have unsaved changes. Remember to click &quot;Save Showcase&quot; to push your updates live.</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-[#BC8242] hover:bg-[#a67136] text-white px-3 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Save Now
          </button>
        </div>
      )}

      {/* 3. Dynamic Section Heading Configuration */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">1. Dynamic Section Heading</h2>
          <p className="text-xs text-slate-500 mt-1">
            Change this heading anytime (e.g., for Eid, Ramadan, or Seasonal Campaigns). It replaces the default &quot;AZAMIS SPECIAL&quot; title on the home page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Section Heading / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AZAMIS SPECIAL, EID SPECIAL"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#BC8242] focus:ring-2 focus:ring-amber-100 outline-none font-bold text-slate-900 text-base"
              />
            </div>

            {/* Quick Title Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Quick Heading Presets (1-Click):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TITLES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTitle(preset)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      title.toUpperCase() === preset
                        ? "bg-amber-100 text-[#BC8242] border border-amber-300 shadow-2xs font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. 100% Pure Alcohol-Free Concentrated Perfume Oils"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#BC8242] focus:ring-2 focus:ring-amber-100 outline-none text-slate-700 text-sm"
              />
            </div>
          </div>

          {/* Live Header Preview */}
          <div className="bg-stone-50/80 rounded-xl p-5 border border-stone-200/80 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">
              Website Live Preview:
            </span>
            <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-2xs">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] bg-stone-300 flex-1 max-w-[80px]" />
                  <h3 className="font-serif-luxury text-base sm:text-xl font-bold tracking-[0.18em] sm:tracking-[0.24em] text-stone-900 uppercase">
                    {title.trim() || "AZAMIS SPECIAL"}
                  </h3>
                  <div className="h-[1px] bg-stone-300 flex-1 max-w-[80px]" />
                </div>
                {subtitle && (
                  <p className="text-[11px] text-[#BC8242] tracking-wider uppercase mt-1 font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. The 8 Showcase Product Slots */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              2. Selected Showcase Products ({selectedIds.filter(Boolean).length} / {DEFAULT_SLOT_COUNT})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select exactly 8 products to showcase in this section. You can easily re-order them using the left/right arrows.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedIds([
                "shamekh-gift-set",
                "baccarat-rouge",
                "janan",
                "oud-al-azami",
                "silver-oud",
                "rakaan",
                "aventus-creed",
                "wisaal-oud",
              ]);
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
          >
            Reset to Original 8
          </button>
        </div>

        {/* 8-Slot Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: DEFAULT_SLOT_COUNT }).map((_, index) => {
            const prodId = selectedIds[index];
            const product = prodId ? productMap.get(prodId) : null;

            return (
              <div
                key={index}
                className={`relative flex flex-col rounded-xl border transition-all ${
                  product
                    ? "bg-white border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-xs"
                    : "bg-slate-50/70 border-dashed border-slate-300 hover:border-[#BC8242] hover:bg-amber-50/20"
                }`}
              >
                {/* Slot Badge */}
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Slot #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Move Left */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, index - 1)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                      title="Move Left"
                    >
                      <ArrowLeft size={13} />
                    </button>
                    {/* Move Right */}
                    <button
                      type="button"
                      disabled={index === DEFAULT_SLOT_COUNT - 1}
                      onClick={() => handleMove(index, index + 1)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                      title="Move Right"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                {product ? (
                  <div className="p-3.5 flex-1 flex flex-col">
                    <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden mb-3 border border-slate-100">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package size={32} />
                        </div>
                      )}
                      {product.sale_badge && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-[#BC8242] text-white rounded">
                          {product.sale_badge}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                      {product.name}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-1 mb-3">
                      <span className="text-[11px] font-semibold text-[#BC8242]">
                        {product.price_display || `Rs${product.min_price || 500}`}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          product.in_stock
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {product.in_stock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    <div className="mt-auto pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPickerSlotIndex(index);
                          setSearchQuery("");
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove from Slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPickerSlotIndex(index);
                      setSearchQuery("");
                    }}
                    className="p-6 flex-1 flex flex-col items-center justify-center text-center group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-300 group-hover:border-[#BC8242] group-hover:text-[#BC8242] flex items-center justify-center text-slate-400 transition-colors mb-2 shadow-2xs">
                      <Plus size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#BC8242]">
                      Add Product
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Click to choose for Slot #{index + 1}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Product Picker Modal */}
      {pickerSlotIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Select Product for Slot #{pickerSlotIndex + 1}
                </h3>
                <p className="text-xs text-slate-500">
                  Choose from any fragrance in your catalog to feature in this position.
                </p>
              </div>
              <button
                onClick={() => setPickerSlotIndex(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fragrances by name or inspired-by..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:border-[#BC8242] focus:ring-2 focus:ring-amber-100 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    categoryFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Categories
                </button>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                      categoryFilter === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                <label className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-[#BC8242] focus:ring-amber-200"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            {/* Products Grid in Modal */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <Package size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No products found</p>
                  <p className="text-xs">Try adjusting your search terms or filters.</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const alreadySelectedSlot = selectedIds.indexOf(p.id);
                  const isCurrentSlot = alreadySelectedSlot === pickerSlotIndex;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p.id)}
                      className={`group relative p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col ${
                        isCurrentSlot
                          ? "border-[#BC8242] bg-amber-50/30 ring-2 ring-[#BC8242]"
                          : alreadySelectedSlot !== -1
                          ? "border-amber-200 bg-amber-50/20"
                          : "border-slate-200 hover:border-[#BC8242] hover:shadow-xs bg-white"
                      }`}
                    >
                      <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden mb-2">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package size={24} />
                          </div>
                        )}
                        {alreadySelectedSlot !== -1 && (
                          <span className="absolute top-1 right-1 text-[9px] font-bold bg-[#BC8242] text-white px-1.5 py-0.5 rounded shadow-xs">
                            Slot #{alreadySelectedSlot + 1}
                          </span>
                        )}
                      </div>

                      <h5 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-[#BC8242] transition-colors">
                        {p.name}
                      </h5>

                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {p.price_display || `Rs${p.min_price || 500}`}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 capitalize">
                          {p.category}
                        </span>
                        <span className="text-[10px] font-bold text-[#BC8242] group-hover:underline">
                          {alreadySelectedSlot !== -1 ? "Replace" : "Select"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredProducts.length} fragrances
              </span>
              <button
                type="button"
                onClick={() => setPickerSlotIndex(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
