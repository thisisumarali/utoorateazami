"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  MessageSquare,
  Download,
} from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.customer_name || "").toLowerCase().includes(q) ||
      (c.customer_phone || "").toLowerCase().includes(q) ||
      (c.customer_city || "").toLowerCase().includes(q) ||
      (c.customer_email || "").toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "City",
      "Total Orders",
      "Total Spent (PKR)",
      "Last Order Date",
    ];
    const rows = customers.map((c) => [
      `"${c.customer_name}"`,
      `"${c.customer_phone}"`,
      `"${c.customer_email || ""}"`,
      `"${c.customer_city || ""}"`,
      c.total_orders,
      c.total_spent,
      `"${new Date(c.last_order_date).toLocaleDateString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated customer contact list, lifetime spend, order history, and direct messaging
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Customers</span>
        </button>
      </div>

      {/* Search and Summary */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div>
            Total: <span className="font-semibold text-slate-900">{customers.length} Customers</span>
          </div>
          <span className="text-slate-300">•</span>
          <div>
            Total Spend:{" "}
            <span className="font-semibold text-slate-900">
              Rs. {customers.reduce((a, b) => a + (b.total_spent || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, phone, city..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Last Order</th>
                <th className="py-3 px-4 text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => {
                  const phoneClean = (c.customer_phone || "").replace(/[^0-9]/g, "");
                  const waPhone = phoneClean.startsWith("0")
                    ? `92${phoneClean.slice(1)}`
                    : phoneClean.startsWith("92")
                    ? phoneClean
                    : `92${phoneClean}`;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.customer_name}</div>
                        {c.customer_email && (
                          <div className="text-[11px] text-slate-500">{c.customer_email}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {c.customer_phone}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {c.customer_city || "Pakistan"}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                          {c.total_orders} Orders
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Rs. {(c.total_spent || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {c.last_order_date
                          ? new Date(c.last_order_date).toLocaleDateString("en-PK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <a
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                            `Hello ${c.customer_name}, regarding your order from Utoor Ate Azami.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition text-xs font-medium"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
