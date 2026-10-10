"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Download,
  ExternalLink,
  Printer,
  Trash2,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Check,
} from "lucide-react";
import { PRODUCTS } from "@/data/storeData";
import { POPULAR_CITIES } from "@/utils/orderStorage";

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";
  const initialSearch = searchParams.get("search") || "";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Modals state
  const [activeOrder, setActiveOrder] = useState(null);
  const [showPackingSlip, setShowPackingSlip] = useState(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New Manual Order Form State
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_city: "Lahore",
    customer_address: "",
    customer_notes: "",
    items: [],
    shipping_fee: 0,
    discount_amount: 0,
  });

  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]?.id || "");
  const [selectedSize, setSelectedSize] = useState("6ml");
  const [itemQty, setItemQty] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/orders", window.location.origin);
      if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (activeOrder && activeOrder.id === orderId) {
          setActiveOrder((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (activeOrder && activeOrder.id === orderId) setActiveOrder(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItemToManualOrder = () => {
    const prod = PRODUCTS.find((p) => p.id === selectedProduct) || PRODUCTS[0];
    const variant = prod.variants?.find((v) => v.size === selectedSize) || {
      size: selectedSize,
      price: prod.minPrice || 500,
    };

    const newItem = {
      id: `${prod.id}-${variant.size}-${Date.now()}`,
      productId: prod.id,
      name: prod.name,
      size: variant.size,
      price: variant.price,
      quantity: parseInt(itemQty, 10) || 1,
      image: prod.image,
    };

    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveManualItem = (idx) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleCreateManualOrder = async (e) => {
    e.preventDefault();
    if (newOrder.items.length === 0) {
      alert("Please add at least one fragrance item to the order.");
      return;
    }

    setActionLoading(true);
    const subtotal = newOrder.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const shipping = parseInt(newOrder.shipping_fee, 10) || (subtotal >= 3000 ? 0 : 250);
    const discount = parseInt(newOrder.discount_amount, 10) || 0;
    const grandTotal = Math.max(0, subtotal - discount + shipping);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newOrder,
          subtotal,
          shipping_fee: shipping,
          discount_amount: discount,
          grand_total: grandTotal,
          payment_method: "Cash on Delivery (COD)",
          status: "Confirmed",
        }),
      });

      if (res.ok) {
        setShowNewOrderModal(false);
        setNewOrder({
          customer_name: "",
          customer_phone: "",
          customer_email: "",
          customer_city: "Lahore",
          customer_address: "",
          customer_notes: "",
          items: [],
          shipping_fee: 0,
          discount_amount: 0,
        });
        fetchOrders();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create order");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "City",
      "Address",
      "Subtotal",
      "Discount",
      "Shipping",
      "Grand Total (PKR)",
      "Status",
    ];

    const rows = orders.map((o) => [
      `"${o.order_number}"`,
      `"${new Date(o.created_at).toLocaleDateString()}"`,
      `"${o.customer_name}"`,
      `"${o.customer_phone}"`,
      `"${o.customer_email || ""}"`,
      `"${o.customer_city || ""}"`,
      `"${(o.customer_address || "").replace(/"/g, '""')}"`,
      o.subtotal,
      o.discount_amount,
      o.shipping_fee,
      o.grand_total,
      `"${o.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadges = {
    Confirmed: "bg-amber-50 text-amber-700 border-amber-200",
    Processing: "bg-blue-50 text-blue-700 border-blue-200",
    Shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Orders Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer orders, track COD shipments, update order lifecycle, and print packing slips
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {["ALL", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedStatus === st
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, phone, city..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-20 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Order Details</th>
                <th className="py-3 px-4">Customer Contact</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No orders found matching the filter.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const phoneClean = (ord.customer_phone || "").replace(/[^0-9]/g, "");
                  const waPhone = phoneClean.startsWith("0")
                    ? `92${phoneClean.slice(1)}`
                    : phoneClean.startsWith("92")
                    ? phoneClean
                    : `92${phoneClean}`;

                  const itemsList = Array.isArray(ord.items)
                    ? ord.items
                    : typeof ord.items === "string"
                    ? JSON.parse(ord.items || "[]")
                    : [];

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-xs text-slate-900">
                          {ord.order_number}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(ord.created_at).toLocaleDateString("en-PK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {ord.payment_method}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{ord.customer_name}</div>
                        <div className="text-[11px] text-slate-600 font-mono">{ord.customer_phone}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {ord.customer_city ? `${ord.customer_city}, ` : ""}
                          {ord.customer_address}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="space-y-1">
                          {itemsList.slice(0, 2).map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 truncate">
                              <span className="font-semibold text-slate-900">{it.name}</span> ({it.size}) ×{" "}
                              {it.quantity}
                            </div>
                          ))}
                          {itemsList.length > 2 && (
                            <div className="text-[10px] text-slate-400 italic">
                              +{itemsList.length - 2} more items
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-slate-900">
                          Rs. {Math.round(parseFloat(ord.grand_total || 0)).toLocaleString()}
                        </div>
                        {parseFloat(ord.discount_amount || 0) > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Saved Rs. {Math.round(parseFloat(ord.discount_amount))}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer ${
                            statusBadges[ord.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {ord.customer_phone && (
                            <a
                              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                                `Assalamu Alaikum ${ord.customer_name},\nRegarding your fragrance order ${ord.order_number} totaling Rs. ${ord.grand_total} from Utoor Ate Azami.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => setActiveOrder(ord)}
                            title="View Full Details"
                            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setShowPackingSlip(ord)}
                            title="Print Packing Slip"
                            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            title="Delete Order"
                            className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Order Details
                </span>
                <h3 className="font-mono text-base font-bold text-slate-900">
                  {activeOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="font-semibold text-slate-900">{activeOrder.customer_name}</div>
              <div className="text-slate-600 font-mono">{activeOrder.customer_phone}</div>
              {activeOrder.customer_email && (
                <div className="text-slate-500">{activeOrder.customer_email}</div>
              )}
              <div className="text-slate-600 pt-1">
                <strong>Address:</strong> {activeOrder.customer_city ? `${activeOrder.customer_city}, ` : ""}{activeOrder.customer_address}
              </div>
              {activeOrder.customer_notes && (
                <div className="text-slate-500 italic pt-1">
                  Note: "{activeOrder.customer_notes}"
                </div>
              )}
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
              {(Array.isArray(activeOrder.items)
                ? activeOrder.items
                : JSON.parse(activeOrder.items || "[]")
              ).map((it, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{it.name}</div>
                      <div className="text-slate-500 text-[11px]">Size: {it.size}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500">Rs. {it.price} × {it.quantity}</div>
                    <div className="font-semibold text-slate-900">Rs. {it.price * it.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>Rs. {Math.round(parseFloat(activeOrder.subtotal || 0))}</span>
              </div>
              {parseFloat(activeOrder.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>- Rs. {Math.round(parseFloat(activeOrder.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping:</span>
                <span>{parseFloat(activeOrder.shipping_fee || 0) === 0 ? "FREE" : `Rs. ${activeOrder.shipping_fee}`}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>Rs. {Math.round(parseFloat(activeOrder.grand_total || 0))}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Status:</span>
                <select
                  value={activeOrder.status}
                  onChange={(e) => handleUpdateStatus(activeOrder.id, e.target.value)}
                  className="bg-white border border-slate-300 text-xs rounded-md px-2.5 py-1"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setShowPackingSlip(activeOrder);
                  setActiveOrder(null);
                }}
                className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Packing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Slip */}
      {showPackingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-8 shadow-xl relative print:p-0 print:m-0 print:shadow-none">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Dispatch Slip
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowPackingSlip(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Content */}
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    UTOOR ATE AZAMI
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Artisanal Attar House • Non-Alcoholic Perfume Oils
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {showPackingSlip.order_number}
                  </div>
                  <div className="text-xs text-slate-500">
                    Date: {new Date(showPackingSlip.created_at).toLocaleDateString()}
                  </div>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {showPackingSlip.payment_method}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Deliver To
                </div>
                <div className="font-bold text-sm text-slate-900">
                  {showPackingSlip.customer_name}
                </div>
                <div className="font-mono text-slate-700 mt-0.5">
                  Phone: {showPackingSlip.customer_phone}
                </div>
                <div className="text-slate-600 mt-1">
                  <strong>City:</strong> {showPackingSlip.customer_city}
                  <br />
                  <strong>Address:</strong> {showPackingSlip.customer_address}
                </div>
                {showPackingSlip.customer_notes && (
                  <div className="mt-2 text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                    <strong>Instructions:</strong> {showPackingSlip.customer_notes}
                  </div>
                )}
              </div>

              <div>
                <table className="w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Size</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(Array.isArray(showPackingSlip.items)
                      ? showPackingSlip.items
                      : JSON.parse(showPackingSlip.items || "[]")
                    ).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{it.name}</td>
                        <td className="p-2.5 text-slate-500">{it.size}</td>
                        <td className="p-2.5 text-center">{it.quantity}</td>
                        <td className="p-2.5 text-right">Rs. {it.price}</td>
                        <td className="p-2.5 text-right font-medium">Rs. {it.price * it.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-56 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>Rs. {Math.round(parseFloat(showPackingSlip.subtotal || 0))}</span>
                  </div>
                  {parseFloat(showPackingSlip.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>- Rs. {Math.round(parseFloat(showPackingSlip.discount_amount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping:</span>
                    <span>{parseFloat(showPackingSlip.shipping_fee || 0) === 0 ? "FREE" : `Rs. ${showPackingSlip.shipping_fee}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t-2 border-slate-900">
                    <span>Total Due (COD):</span>
                    <span>Rs. {Math.round(parseFloat(showPackingSlip.grand_total || 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-base text-slate-900">
                Create Manual Order
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrder.customer_name}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                    placeholder="Full name"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrder.customer_phone}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                    placeholder="0300 1234567"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrder.customer_city}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_city: e.target.value })}
                    placeholder="City"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newOrder.customer_email}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_email: e.target.value })}
                    placeholder="customer@email.com"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newOrder.customer_address}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_address: e.target.value })}
                  placeholder="Complete address..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-800">Add Items</div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2"
                    >
                      {PRODUCTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2"
                    >
                      <option value="3ml">3ml</option>
                      <option value="6ml">6ml</option>
                      <option value="12ml">12ml</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-12 bg-white border border-slate-300 text-xs rounded-lg p-2 text-center"
                    />
                    <button
                      type="button"
                      onClick={handleAddItemToManualOrder}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {newOrder.items.length > 0 && (
                  <div className="mt-2 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {newOrder.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 text-xs">
                        <div>{it.name} ({it.size}) × {it.quantity}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Rs. {it.price * it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveManualItem(idx)}
                            className="text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Notes
                </label>
                <input
                  type="text"
                  value={newOrder.customer_notes}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_notes: e.target.value })}
                  placeholder="Special instructions..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer"
              >
                {actionLoading ? "Saving..." : "Create Order"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading orders...</p>
        </div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
