"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  RefreshCw,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { SITE_CONFIG } from "@/data/storeData";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState({});

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setStatusUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500">Loading dashboard...</span>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];
  const topProducts = data?.topProducts || [];
  const recentMessages = data?.recentMessages || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store metrics and recent customer activity for {SITE_CONFIG.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-slate-500" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs transition"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Orders</span>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <span className="text-[11px] font-semibold text-slate-400">PKR</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            Rs. {(stats.totalRevenue || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active Sales & COD</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.totalOrders || 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-medium">
              {stats.ordersBreakdown?.delivered || 0} Delivered
            </span>
            <span>•</span>
            <span className="text-amber-600 font-medium">
              {(stats.ordersBreakdown?.confirmed || 0) + (stats.ordersBreakdown?.shipped || 0)} In Progress
            </span>
          </div>
        </div>

        {/* Active Products */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Fragrances
            </span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.totalProducts || 0}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-medium">In Catalog</span>
            {stats.outOfStockCount > 0 && (
              <span className="text-rose-600 font-medium">({stats.outOfStockCount} Out of stock)</span>
            )}
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Order Value
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            Rs. {(stats.averageOrderValue || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>Free shipping: Rs. {SITE_CONFIG.freeShippingThreshold}</span>
          </div>
        </div>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/orders?status=Confirmed"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition flex items-center justify-between shadow-2xs"
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Confirmed
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.ordersBreakdown?.confirmed || 0}
            </div>
          </div>
          <Clock className="w-4 h-4 text-amber-600" />
        </Link>

        <Link
          href="/admin/orders?status=Shipped"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between shadow-2xs"
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Shipped / Transit
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.ordersBreakdown?.shipped || 0}
            </div>
          </div>
          <Truck className="w-4 h-4 text-blue-600" />
        </Link>

        <Link
          href="/admin/orders?status=Delivered"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition flex items-center justify-between shadow-2xs"
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Delivered
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.ordersBreakdown?.delivered || 0}
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </Link>

        <Link
          href="/admin/orders?status=Cancelled"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 transition flex items-center justify-between shadow-2xs"
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
              Cancelled
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.ordersBreakdown?.cancelled || 0}
            </div>
          </div>
          <AlertTriangle className="w-4 h-4 text-rose-600" />
        </Link>
      </div>

      {/* Main Grid: Recent Orders & Top Fragrances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
              <p className="text-xs text-slate-500">Latest customer purchases and Cash on Delivery dispatches</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Order #</th>
                  <th className="py-2.5 px-3 font-semibold">Customer</th>
                  <th className="py-2.5 px-3 font-semibold">City</th>
                  <th className="py-2.5 px-3 font-semibold">Amount</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => {
                    const statusColors = {
                      Confirmed: "bg-amber-50 text-amber-700 border-amber-200",
                      Processing: "bg-blue-50 text-blue-700 border-blue-200",
                      Shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
                      Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
                    };

                    const phoneClean = (ord.customer_phone || "").replace(/[^0-9]/g, "");
                    const waPhone = phoneClean.startsWith("0")
                      ? `92${phoneClean.slice(1)}`
                      : phoneClean.startsWith("92")
                      ? phoneClean
                      : `92${phoneClean}`;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-mono font-medium text-slate-900">
                          {ord.order_number}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{ord.customer_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {ord.customer_phone}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{ord.customer_city || "N/A"}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          Rs. {Math.round(parseFloat(ord.grand_total || 0)).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={ord.status}
                            disabled={statusUpdating[ord.id]}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                            className={`text-[11px] font-semibold px-2 py-1 rounded-md border cursor-pointer ${
                              statusColors[ord.status] || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {ord.customer_phone && (
                              <a
                                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                                  `Hello ${ord.customer_name}, regarding your order ${ord.order_number} at Utoor Ate Azami.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp Customer"
                                className="p-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Link
                              href={`/admin/orders?search=${ord.order_number}`}
                              className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Order Details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Inquiries Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#BC8242]" />
                <h3 className="text-sm font-bold text-slate-900">Recent Customer Inquiries</h3>
                {stats.unreadMessages > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {stats.unreadMessages} New
                  </span>
                )}
              </div>
              <Link
                href="/admin/messages"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View All Inquiries</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {recentMessages.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  No inquiries recorded yet. Customer submissions from your website contact form will appear here.
                </div>
              ) : (
                recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{msg.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {msg.topic}
                        </span>
                        {msg.status === "Unread" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 truncate">{msg.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href="/admin/messages"
                        className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium hover:bg-slate-800"
                      >
                        Respond
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Top Fragrances & Quick Navigation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Attars */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Top Products</h2>
              <Link href="/admin/products" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                >
                  <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden relative">
                    <img
                      src={p.image || "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{p.category}</div>
                    <div className="text-[11px] font-semibold text-slate-700">
                      From Rs. {p.price}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border ${
                        p.inStock !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {p.inStock !== false ? "In Stock" : "Sold Out"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Operations Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/admin/orders"
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition text-center font-medium"
              >
                + New Order
              </Link>
              <Link
                href="/admin/products"
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition text-center font-medium"
              >
                + Add Product
              </Link>
              <Link
                href="/admin/messages"
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition text-center font-medium flex items-center justify-center gap-1.5"
              >
                <span>Inquiries</span>
                {stats.unreadMessages > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </Link>
              <Link
                href="/admin/coupons"
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition text-center font-medium"
              >
                Coupons
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
