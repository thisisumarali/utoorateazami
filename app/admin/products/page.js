"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FolderTree,
  X,
} from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Categories from PostgreSQL
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: "",
    category: "",
    category_display: "",
    min_price: 500,
    max_price: 2000,
    sale_badge: "",
    inspired_by: "",
    image: "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png",
    secondary_image: "",
    description: "",
    pyramid_top: "Fresh Bergamot, Royal Citrus",
    pyramid_heart: "Taif Rose, Jasmine Petals, Cedar",
    pyramid_base: "Cambodian Oud, Ambergris, Soft Musk",
    in_stock: true,
    category_ids: [],
    variants: [
      { size: "3ml", price: 500, regularPrice: 625, inStock: true },
      { size: "6ml", price: 1000, regularPrice: 1250, inStock: true },
      { size: "12ml", price: 2000, regularPrice: 2500, inStock: true },
    ],
  };

  const [formData, setFormData] = useState(initialForm);

  // 1. Fetch Categories from PostgreSQL
  const fetchCategoryData = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || data.mainCategories || []);
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 2. Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/products", window.location.origin);
      if (categoryFilter !== "ALL") url.searchParams.set("category", categoryFilter);
      if (stockFilter !== "ALL") url.searchParams.set("stock", stockFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, stockFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const getCategoryDisplayName = (cid) => {
    const found = categories.find((c) => c.id === cid);
    if (found) return found.name;
    return cid;
  };

  const handleToggleStock = async (product) => {
    const newStock = !product.in_stock;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, in_stock: newStock } : p))
    );

    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ in_stock: newStock }),
      });
    } catch (err) {
      console.error(err);
      fetchProducts();
    }
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    const pyramid = p.pyramid || {};
    const catIds = p.category_ids || [];

    // Find category from p.category or catIds
    let selectedCat = p.category || "";
    if (!selectedCat && catIds.length > 0) {
      const match = categories.find((m) => catIds.includes(m.id));
      if (match) selectedCat = match.id;
    }

    // Parse variants or construct clean defaults
    let productVariants = [];
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      productVariants = p.variants.map((v) => ({
        size: v.size || "Standard",
        price: v.price !== undefined ? v.price : 500,
        regularPrice: v.regularPrice || "",
        inStock: v.inStock !== false,
      }));
    } else {
      const minP = p.min_price || p.minPrice || 500;
      const maxP = p.max_price || p.maxPrice || 2000;
      productVariants = [
        { size: "3ml", price: minP, regularPrice: Math.round(minP * 1.25), inStock: true },
        { size: "6ml", price: Math.round(minP * 2), regularPrice: Math.round(minP * 2.5), inStock: true },
        { size: "12ml", price: maxP, regularPrice: Math.round(maxP * 1.25), inStock: true },
      ];
    }

    setFormData({
      name: p.name || "",
      category: selectedCat,
      category_display: p.category_display || p.categoryDisplay || (selectedCat ? getCategoryDisplayName(selectedCat) : ""),
      min_price: p.min_price || p.minPrice || 500,
      max_price: p.max_price || p.maxPrice || 2000,
      sale_badge: p.sale_badge || p.saleBadge || "",
      inspired_by: p.inspired_by || p.inspiredBy || "",
      image: p.image || "",
      secondary_image: p.secondary_image || p.secondaryImage || "",
      description: p.description || "",
      pyramid_top: pyramid.top || "",
      pyramid_heart: pyramid.heart || "",
      pyramid_base: pyramid.base || "",
      in_stock: p.in_stock !== false,
      category_ids: catIds,
      variants: productVariants,
    });
    setShowProductModal(true);
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    const defaultCat = categories.length > 0 ? categories[0] : null;
    const defaultCatId = defaultCat ? defaultCat.id : "mens";
    const defaultCatName = defaultCat ? defaultCat.name : "Men's Collection";

    setFormData({
      ...initialForm,
      category: defaultCatId,
      category_display: defaultCatName,
      category_ids: defaultCatId ? [defaultCatId] : [],
      variants: [
        { size: "3ml", price: 500, regularPrice: 650, inStock: true },
        { size: "6ml", price: 1000, regularPrice: 1250, inStock: true },
        { size: "12ml", price: 2000, regularPrice: 2500, inStock: true },
      ],
    });
    setShowProductModal(true);
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        { size: "", price: 1000, regularPrice: "", inStock: true },
      ],
    }));
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => {
      const next = prev.variants.filter((_, i) => i !== index);
      return {
        ...prev,
        variants: next.length > 0 ? next : [{ size: "Standard", price: 500, regularPrice: "", inStock: true }],
      };
    });
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.variants || [])];
      updated[index] = {
        ...updated[index],
        [field]: field === "price" || field === "regularPrice"
          ? (value === "" ? "" : parseFloat(value) || 0)
          : value,
      };
      return { ...prev, variants: updated };
    });
  };

  const applyVariantPreset = (type) => {
    if (type === "attar") {
      setFormData((prev) => ({
        ...prev,
        variants: [
          { size: "3ml", price: 500, regularPrice: 650, inStock: true },
          { size: "6ml", price: 1000, regularPrice: 1250, inStock: true },
          { size: "12ml", price: 2000, regularPrice: 2500, inStock: true },
        ],
      }));
    } else if (type === "perfume") {
      setFormData((prev) => ({
        ...prev,
        variants: [
          { size: "25ml", price: 1500, regularPrice: 1800, inStock: true },
          { size: "50ml", price: 2800, regularPrice: 3200, inStock: true },
          { size: "100ml", price: 4800, regularPrice: 5500, inStock: true },
        ],
      }));
    } else if (type === "single") {
      setFormData((prev) => ({
        ...prev,
        variants: [
          { size: "Standard", price: 1500, regularPrice: "", inStock: true },
        ],
      }));
    }
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    const found = categories.find((c) => c.id === selectedId);

    setFormData((prev) => ({
      ...prev,
      category: selectedId,
      category_display: found ? found.name : prev.category_display,
      category_ids: selectedId ? [selectedId] : [],
    }));
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const categoryIds = formData.category ? [formData.category] : [];

    // Calculate min and max price automatically from variants
    const validVariants = (formData.variants && formData.variants.length > 0)
      ? formData.variants.map((v) => ({
          size: v.size?.trim() || "Standard",
          price: parseFloat(v.price) || 0,
          regularPrice: v.regularPrice !== "" && v.regularPrice !== undefined ? parseFloat(v.regularPrice) : null,
          inStock: v.inStock !== false,
        }))
      : [{ size: "Standard", price: 500, regularPrice: null, inStock: true }];

    const prices = validVariants.map((v) => v.price).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 500;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice;
    const priceDisplay = minPrice === maxPrice
      ? `Rs. ${minPrice.toLocaleString()}`
      : `Rs. ${minPrice.toLocaleString()} - Rs. ${maxPrice.toLocaleString()}`;

    const foundCat = categories.find((c) => c.id === formData.category);
    const categoryDisplay =
      (foundCat ? foundCat.name : "") ||
      formData.category_display ||
      "Luxury Fragrance";

    const payload = {
      name: formData.name,
      category: formData.category,
      category_display: categoryDisplay,
      min_price: minPrice,
      max_price: maxPrice,
      price_display: priceDisplay,
      sale_badge: formData.sale_badge || null,
      inspired_by: formData.inspired_by || null,
      image: formData.image,
      secondary_image: formData.secondary_image,
      description: formData.description,
      in_stock: formData.in_stock,
      category_ids: categoryIds,
      pyramid: {
        top: formData.pyramid_top,
        heart: formData.pyramid_heart,
        base: formData.pyramid_base,
      },
      variants: validVariants,
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowProductModal(false);
          fetchProducts();
        } else {
          alert("Failed to update product");
        }
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowProductModal(false);
          fetchProducts();
        } else {
          alert("Failed to create product");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving fragrance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products Catalog</h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Live DB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage fragrance inventory, categories, pricing, and stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/categories"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-2xs"
          >
            <FolderTree className="w-3.5 h-3.5 text-slate-500" />
            <span>Categories ({categories.length})</span>
          </Link>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Clean Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter Buttons */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStockFilter("ALL")}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                stockFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("in")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                stockFilter === "in"
                  ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${stockFilter === "in" ? "bg-white" : "bg-emerald-500"}`} />
              In Stock
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("out")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                stockFilter === "out"
                  ? "bg-rose-600 text-white shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-rose-700"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${stockFilter === "out" ? "bg-white" : "bg-rose-500"}`} />
              Out of Stock
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline">
            ({products.length} products)
          </span>
        </div>

        <form onSubmit={handleSearch} className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by fragrance name or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
          />
        </form>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading fragrance catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No fragrances found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const minPrice = p.min_price || p.minPrice || 500;
            const maxPrice = p.max_price || p.maxPrice || 2000;
            const catIds = p.category_ids || [];

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="relative aspect-square bg-slate-100 overflow-hidden group">
                  <img
                    src={p.image || "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png"}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {(p.sale_badge || p.saleBadge) && (
                    <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                      {p.sale_badge || p.saleBadge}
                    </span>
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={() => handleToggleStock(p)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1 cursor-pointer transition ${
                        p.in_stock
                          ? "bg-emerald-500/90 text-white hover:bg-emerald-600"
                          : "bg-rose-500/90 text-white hover:bg-rose-600"
                      }`}
                    >
                      {p.in_stock ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-white" />
                          <span>Out of Stock</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                        {p.name}
                      </h3>
                      <Link
                        href={`/product/${p.id}`}
                        target="_blank"
                        className="text-slate-400 hover:text-slate-700 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {(p.inspired_by || p.inspiredBy) && (
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                        {p.inspired_by || p.inspiredBy}
                      </p>
                    )}

                    {/* Category Badges */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                        {p.category_display || getCategoryDisplayName(p.category)}
                      </span>

                      {catIds.slice(0, 3).map((cid) => {
                        const name = getCategoryDisplayName(cid);
                        if (name === p.category_display) return null;
                        return (
                          <span
                            key={cid}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                          >
                            {name}
                          </span>
                        );
                      })}
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {p.description || "Artisanal concentrated perfume oil."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">
                        Price
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        Rs. {minPrice} - Rs. {maxPrice}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Fragrance Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-base text-slate-900">
                  {editingProduct ? `Edit "${editingProduct.name}"` : "Add New Fragrance"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Assign Category, pricing & olfactory details
                </p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fragrance Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. OUD SUPREME"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Category Selection */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FolderTree className="w-3.5 h-3.5 text-slate-600" />
                    Category <span className="text-rose-500">*</span>
                  </span>
                  <Link
                    href="/admin/categories"
                    target="_blank"
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Manage Categories</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sizes, Quantities & Pricing Box (Flexible Variants) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Sizes & Pricing Variants</span>
                      <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {formData.variants?.length || 0} Option{(formData.variants?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Set specific prices for sizes (e.g. Attars: 3ml, 6ml, 12ml or Perfumes: 25ml, 50ml, 100ml)
                    </p>
                  </div>

                  {/* 1-Click Quick Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
                    <button
                      type="button"
                      onClick={() => applyVariantPreset("attar")}
                      className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Set 3ml, 6ml, 12ml"
                    >
                      Attar (3, 6, 12ml)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVariantPreset("perfume")}
                      className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Set 25ml, 50ml, 100ml"
                    >
                      Perfume (25, 50, 100ml)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVariantPreset("single")}
                      className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Single standard price"
                    >
                      Single Price
                    </button>
                  </div>
                </div>

                {/* Variant Rows Table */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <div className="col-span-4 sm:col-span-3">Size / Measure *</div>
                    <div className="col-span-4 sm:col-span-3">Price (Rs.) *</div>
                    <div className="col-span-3 sm:col-span-3">Regular Price (Rs.)</div>
                    <div className="hidden sm:block sm:col-span-2 text-center">Status</div>
                    <div className="col-span-1 text-right"></div>
                  </div>

                  {formData.variants && formData.variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs"
                    >
                      {/* Size / Measure */}
                      <div className="col-span-4 sm:col-span-3">
                        <input
                          type="text"
                          required
                          value={v.size}
                          onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                          placeholder="e.g. 6ml or 50ml"
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-slate-800"
                        />
                      </div>

                      {/* Selling Price */}
                      <div className="col-span-4 sm:col-span-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">Rs.</span>
                          <input
                            type="number"
                            min={0}
                            required
                            value={v.price}
                            onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                            placeholder="1000"
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none focus:border-slate-800"
                          />
                        </div>
                      </div>

                      {/* Regular / Original Price (Optional) */}
                      <div className="col-span-3 sm:col-span-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">Rs.</span>
                          <input
                            type="number"
                            min={0}
                            value={v.regularPrice || ""}
                            onChange={(e) => handleVariantChange(idx, "regularPrice", e.target.value)}
                            placeholder="1250"
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 focus:bg-white focus:outline-none focus:border-slate-800"
                          />
                        </div>
                      </div>

                      {/* In Stock toggle */}
                      <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleVariantChange(idx, "inStock", !v.inStock)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold border transition cursor-pointer ${
                            v.inStock !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                        >
                          {v.inStock !== false ? "In Stock" : "Out of Stock"}
                        </button>
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          disabled={formData.variants.length <= 1}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Remove variant"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Bar: Add Button & Auto-Calculated Price Display */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Size Variant</span>
                  </button>

                  <div className="text-[11px] text-slate-600 flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Storefront Price:</span>
                    <span className="font-bold text-slate-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      {(() => {
                        const prices = (formData.variants || [])
                          .map((v) => parseFloat(v.price) || 0)
                          .filter((p) => p > 0);
                        if (prices.length === 0) return "Rs. 0";
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max
                          ? `Rs. ${min.toLocaleString()}`
                          : `Rs. ${min.toLocaleString()} – Rs. ${max.toLocaleString()}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inspired By & Sale Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inspired By Note
                  </label>
                  <input
                    type="text"
                    value={formData.inspired_by}
                    onChange={(e) => setFormData({ ...formData, inspired_by: e.target.value })}
                    placeholder="e.g. Creed Aventus"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sale Badge
                  </label>
                  <input
                    type="text"
                    value={formData.sale_badge}
                    onChange={(e) => setFormData({ ...formData, sale_badge: e.target.value })}
                    placeholder="e.g. 20% OFF"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Fragrance Images (Uploaded directly to Cloudinary) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload
                  label="Primary Fragrance Image"
                  required
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  folder="utoorateazami/products"
                  aspect="square"
                />
                <ImageUpload
                  label="Secondary / Box Image"
                  value={formData.secondary_image}
                  onChange={(url) => setFormData({ ...formData, secondary_image: url })}
                  folder="utoorateazami/products"
                  aspect="square"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the fragrance character and artisanal craftsmanship..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Fragrance Pyramid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Top Notes</label>
                  <input
                    type="text"
                    value={formData.pyramid_top}
                    onChange={(e) => setFormData({ ...formData, pyramid_top: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heart Notes</label>
                  <input
                    type="text"
                    value={formData.pyramid_heart}
                    onChange={(e) => setFormData({ ...formData, pyramid_heart: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Notes</label>
                  <input
                    type="text"
                    value={formData.pyramid_base}
                    onChange={(e) => setFormData({ ...formData, pyramid_base: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Stock Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="in_stock_checkbox"
                  checked={formData.in_stock}
                  onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
                <label htmlFor="in_stock_checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Available in Stock
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? "Update Fragrance" : "Add Fragrance"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
