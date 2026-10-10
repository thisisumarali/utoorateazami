"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  FolderTree,
  AlertCircle,
  Package,
} from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inNavFilter, setInNavFilter] = useState("all");

  // Form State
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png",
    banner_image: "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png",
    sort_order: 1,
    show_in_nav: "Yes",
    status: "Active",
    meta_title: "",
    meta_description: "",
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      const list = data.categories || [];
      setCategories(list);
    } catch (e) {
      console.error("Failed to fetch categories", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-slugify name if not manually edited
  const handleNameChange = (val) => {
    setForm((prev) => {
      const updated = { ...prev, name: val };
      if (!slugManuallyEdited && !editingCategory) {
        updated.slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return updated;
    });
  };

  // Open Add Category Modal
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setSlugManuallyEdited(false);
    setErrorMessage("");
    setForm({
      name: "",
      slug: "",
      description: "",
      image: "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png",
      banner_image: "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png",
      sort_order: (categories.length || 0) + 1,
      show_in_nav: "Yes",
      status: "Active",
      meta_title: "",
      meta_description: "",
    });
    setShowModal(true);
  };

  // Open Edit Category Modal
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setSlugManuallyEdited(true);
    setErrorMessage("");
    setForm({
      name: cat.name || "",
      slug: cat.id || "",
      description: cat.description || cat.title || "",
      image: cat.image || "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png",
      banner_image:
        cat.banner_image || cat.image || "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png",
      sort_order: cat.sort_order !== undefined ? cat.sort_order : 1,
      show_in_nav: cat.show_in_nav || "Yes",
      status: cat.status || "Active",
      meta_title: cat.meta_title || `${cat.name} | Utoor-e-Azami Luxury Fragrance`,
      meta_description:
        cat.meta_description || cat.description || `Handcrafted artisanal fragrance collection for ${cat.name}.`,
    });
    setShowModal(true);
  };

  // Save Category (Create or Update)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        banner_image: form.banner_image.trim(),
        sort_order: parseInt(form.sort_order, 10) || 1,
        show_in_nav: form.show_in_nav,
        status: form.status,
        meta_title: form.meta_title.trim(),
        meta_description: form.meta_description.trim(),
      };

      if (!payload.name) {
        setErrorMessage("Category name is required");
        setSubmitting(false);
        return;
      }

      if (editingCategory) {
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update category");
        }
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create category");
        }
      }

      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDelete = async (id, name, prodCount) => {
    const msg =
      prodCount > 0
        ? `Are you sure you want to delete category "${name}"?\n\nIt currently contains ${prodCount} products.`
        : `Are you sure you want to delete category "${name}"?`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }
      fetchCategories();
    } catch (err) {
      alert(err.message || "Failed to delete category");
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return categories
      .filter((cat) => {
        if (statusFilter !== "all" && cat.status !== statusFilter) return false;
        if (inNavFilter !== "all" && cat.show_in_nav !== inNavFilter) return false;
        if (query) {
          const nameMatch = cat.name?.toLowerCase().includes(query);
          const slugMatch = cat.id?.toLowerCase().includes(query);
          const descMatch = (cat.description || cat.title || "")?.toLowerCase().includes(query);
          return nameMatch || slugMatch || descMatch;
        }
        return true;
      })
      .sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1) || a.name.localeCompare(b.name));
  }, [categories, searchQuery, statusFilter, inNavFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage fragrance categories for store catalog and navigation
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#800020] hover:bg-[#68001a] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Category</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          {/* Search Input */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-600">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20 transition"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* In Nav Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-600">In Nav</label>
            <select
              value={inNavFilter}
              onChange={(e) => setInNavFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20 transition"
            >
              <option value="all">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-16">IMAGE</th>
                <th className="py-3 px-4">NAME & DESCRIPTION</th>
                <th className="py-3 px-4">SLUG</th>
                <th className="py-3 px-4 text-center">PRODUCTS</th>
                <th className="py-3 px-4 text-center">SORT</th>
                <th className="py-3 px-4 text-center">IN NAV</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-right pr-6">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading categories...</span>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No categories found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery
                        ? "Try clearing your search query or filters"
                        : "Click '+ Add Category' above to create your first category."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/80 transition-colors bg-white font-medium"
                  >
                    {/* Image */}
                    <td className="py-2.5 px-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                        <img
                          src={
                            cat.image ||
                            "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png"
                          }
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://utoorateazami.com/wp-content/uploads/2024/08/66-1024x1024.png";
                          }}
                        />
                      </div>
                    </td>

                    {/* Name & Title */}
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 text-[13px]">
                        {cat.name}
                      </div>
                      {(cat.description || cat.title) && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs font-normal">
                          {cat.description || cat.title}
                        </div>
                      )}
                    </td>

                    {/* Slug */}
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {cat.id}
                    </td>

                    {/* Products count */}
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Package className="w-3 h-3 text-slate-400" />
                        {cat.product_count !== undefined ? cat.product_count : 0}
                      </span>
                    </td>

                    {/* Sort Order */}
                    <td className="py-2.5 px-4 text-center text-slate-600 font-mono text-[11px]">
                      {cat.sort_order || 1}
                    </td>

                    {/* In Nav */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          cat.show_in_nav === "Yes"
                            ? "bg-sky-50 text-sky-600 border border-sky-100"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {cat.show_in_nav || "Yes"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          cat.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {cat.status || "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5 stroke-[1.8]" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name, cat.product_count || 0)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Modal Body Form */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              {/* Row 1: Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload
                  label="Category Image"
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                  folder="utoorateazami/categories"
                  aspect="square"
                />
                <ImageUpload
                  label="Banner Image (Optional)"
                  value={form.banner_image}
                  onChange={(url) => setForm({ ...form, banner_image: url })}
                  folder="utoorateazami/categories"
                  aspect="banner"
                />
              </div>

              {/* Row 2: Name * and Slug * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. MEN'S or OUD"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Slug / URL Handle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setForm({ ...form, slug: e.target.value });
                    }}
                    placeholder="e.g. mens or oud"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20"
                  />
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Tagline</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Bold, Woody & Aromatic fragrances..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20 resize-none"
                />
              </div>

              {/* Row 4: Sort Order, Show In Nav, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    min={1}
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    placeholder="1"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Show In Nav</label>
                  <select
                    value={form.show_in_nav}
                    onChange={(e) => setForm({ ...form, show_in_nav: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 5: SEO Meta Title & Description */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Search Engine Optimization (SEO)
                </span>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={form.meta_title}
                    onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                    placeholder="Category Meta Title..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Meta Description</label>
                  <input
                    type="text"
                    value={form.meta_description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                    placeholder="Short SEO meta description..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/20"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#800020] hover:bg-[#68001a] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
