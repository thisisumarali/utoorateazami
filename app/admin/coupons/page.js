"use client";

import { useState, useEffect } from "react";
import { TicketPercent, Plus, Trash2, Check, X } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: "",
    percent: 10,
    label: "",
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (coupon) => {
    const newActive = !coupon.is_active;
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: newActive } : c))
    );

    try {
      await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActive }),
      });
    } catch (err) {
      console.error(err);
      fetchCoupons();
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ code: "", percent: 10, label: "" });
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Are you sure you want to remove promo code "${code}"?`)) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Promo Codes & Discounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure checkout discount percentages and active store campaigns
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <TicketPercent className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No coupons active</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`p-5 rounded-xl border bg-white shadow-xs transition flex flex-col justify-between space-y-4 ${
                c.is_active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-lg font-bold tracking-tight text-slate-900">
                    {c.code}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {c.percent}% OFF
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(c)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition cursor-pointer ${
                    c.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {c.is_active ? "● Active on Checkout" : "○ Inactive"}
                </button>

                <button
                  onClick={() => handleDelete(c.id, c.code)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-base text-slate-900">New Coupon Code</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER15"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Discount Percentage (%) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={form.percent}
                  onChange={(e) => setForm({ ...form, percent: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. 15% Summer Special Promotion"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer"
              >
                {submitting ? "Saving..." : "Create Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
