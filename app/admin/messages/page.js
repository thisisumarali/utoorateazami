"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  X,
  Send,
  Check,
  Tag,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({ total: 0, unread: 0, read: 0, replied: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMessage, setActiveMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("Unread");

  const fetchMessages = async () => {
    try {
      const url = new URL("/api/admin/messages", window.location.origin);
      if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMessages();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleOpenDetail = (msg) => {
    setActiveMessage(msg);
    setStatusDraft(msg.status || "Unread");
    setNotesDraft(msg.notes || "");
    // If it was unread, auto-mark as Read
    if (msg.status === "Unread") {
      handleUpdateStatus(msg.id, "Read", false);
    }
  };

  const handleUpdateStatus = async (id, newStatus, reload = true) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        );
        if (activeMessage && activeMessage.id === id) {
          setActiveMessage((prev) => ({ ...prev, status: newStatus }));
          setStatusDraft(newStatus);
        }
        if (reload) fetchMessages();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeMessage) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/messages/${activeMessage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft, status: statusDraft }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === activeMessage.id
              ? { ...m, notes: notesDraft, status: statusDraft }
              : m
          )
        );
        setActiveMessage((prev) => ({
          ...prev,
          notes: notesDraft,
          status: statusDraft,
        }));
        fetchMessages();
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (activeMessage && activeMessage.id === id) {
          setActiveMessage(null);
        }
        fetchMessages();
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const getCleanPhone = (phone) => {
    let clean = (phone || "").replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) clean = "92" + clean.slice(1);
    if (!clean.startsWith("92") && clean.length === 10) clean = "92" + clean;
    return clean;
  };

  const getTopicColor = (topic) => {
    switch (topic) {
      case "Product Inquiry":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Wholesale & Bulk":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "Order Tracking":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Custom Gift Sets":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Unread":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Unread
          </span>
        );
      case "Replied":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check size={11} className="text-emerald-700" />
            Replied
          </span>
        );
      case "Read":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Read
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer Inquiries & Messages
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage submissions from your website contact form, wholesale requests, and direct customer questions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-slate-500" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Inquiries
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {counts.total}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <MessageSquare size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between bg-amber-50/20">
          <div>
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Unread Inquiries</span>
              {counts.unread > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {counts.unread}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between bg-emerald-50/20">
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Replied Inquiries
            </div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">
              {counts.replied}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: `All (${counts.total})` },
              { id: "Unread", label: `Unread (${counts.unread})` },
              { id: "Read", label: `Read (${counts.read})` },
              { id: "Replied", label: `Replied (${counts.replied})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatus === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Search by name, phone, message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50 focus:bg-white transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
        </div>
      </div>

      {/* Messages List / Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Loading inquiries...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <MessageSquare size={20} />
          </div>
          <div className="font-semibold text-slate-800 text-sm">No Messages Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No inquiries matching "${searchQuery}". Try clearing search.`
              : "When customers submit questions from your website contact form, they will appear here dynamically."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {messages.map((msg) => {
              const cleanPhone = getCleanPhone(msg.phone);
              const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `Hello ${msg.name}! Thank you for contacting Utoorat e Azami regarding "${msg.topic}". How can we assist you?`
              )}`;

              return (
                <div
                  key={msg.id}
                  onClick={() => handleOpenDetail(msg)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors cursor-pointer hover:bg-slate-50/80 ${
                    msg.status === "Unread" ? "bg-amber-50/30" : ""
                  }`}
                >
                  {/* Left: Customer Info & Message Preview */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {msg.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTopicColor(
                          msg.topic
                        )}`}
                      >
                        {msg.topic}
                      </span>
                      {getStatusBadge(msg.status)}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 pr-4">
                      {msg.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="text-[#BC8242]" />
                        <span>{msg.phone}</span>
                      </span>
                      {msg.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} className="text-slate-400" />
                          <span>{msg.email}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        <span>
                          {new Date(msg.created_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                  >
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
                      title="Reply directly on WhatsApp"
                    >
                      <MessageSquare size={13} />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          msg.id,
                          msg.status === "Unread" ? "Read" : "Unread"
                        )
                      }
                      className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                      title={msg.status === "Unread" ? "Mark as Read" : "Mark as Unread"}
                    >
                      {msg.status === "Unread" ? "Mark Read" : "Mark Unread"}
                    </button>

                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 rounded-md bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                      title="Delete inquiry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Detail & WhatsApp Reply Modal */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#BC8242]/10 text-[#BC8242] flex items-center justify-center">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Inquiry Details
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    ID #{activeMessage.id} • Received{" "}
                    {new Date(activeMessage.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Customer Contact Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-semibold text-slate-900 text-base">
                    {activeMessage.name}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTopicColor(
                      activeMessage.topic
                    )}`}
                  >
                    {activeMessage.topic}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-[#BC8242]" />
                    <a
                      href={`tel:${activeMessage.phone}`}
                      className="font-medium hover:underline text-slate-800"
                    >
                      {activeMessage.phone}
                    </a>
                  </div>
                  {activeMessage.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-400" />
                      <a
                        href={`mailto:${activeMessage.email}`}
                        className="hover:underline truncate"
                      >
                        {activeMessage.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Customer Message:
                </label>
                <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-200/60 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {activeMessage.message}
                </div>
              </div>

              {/* Status & Quick WhatsApp Reply */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Status:
                  </label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="Unread">Unread</option>
                    <option value="Read">Read</option>
                    <option value="Replied">Replied</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Quick WhatsApp Reply:
                  </label>
                  <a
                    href={`https://wa.me/${getCleanPhone(
                      activeMessage.phone
                    )}?text=${encodeURIComponent(
                      `Hello ${activeMessage.name}! Thank you for contacting Utoorat e Azami regarding "${activeMessage.topic}".`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setStatusDraft("Replied");
                      handleUpdateStatus(activeMessage.id, "Replied", false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                  >
                    <MessageSquare size={13} />
                    <span>Open in WhatsApp</span>
                    <ExternalLink size={11} className="opacity-80" />
                  </a>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <FileText size={12} />
                  <span>Internal Admin Notes:</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Record customer preferences, quote given, or call notes..."
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <button
                onClick={() => handleDelete(activeMessage.id)}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMessage(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium rounded-lg border border-slate-200 bg-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
