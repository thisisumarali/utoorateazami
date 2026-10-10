"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Layers,
  Users,
  TicketPercent,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Store,
  MessageSquare,
} from "lucide-react";
import { SITE_CONFIG } from "@/data/storeData";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Coupons", href: "/admin/coupons", icon: TicketPercent },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If on login page, render clean layout without admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error(err);
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center font-serif font-bold text-amber-400 text-base shadow-xs">
              ع
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-slate-900 leading-tight">
                {SITE_CONFIG.name}
              </div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Store Administration
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Management
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-semibold text-xs text-slate-700">
              SA
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold text-slate-900 truncate">Salman Azami</div>
              <div className="text-[11px] text-slate-500 truncate">salman@utoorate.com</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition border border-slate-200 shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Storefront</span>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="flex items-center justify-center p-2 rounded-md bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition border border-slate-200 shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="h-16 px-4 lg:px-8 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800">
                {SITE_CONFIG.name}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-xs text-slate-500 capitalize hidden sm:inline">
                {pathname.replace("/admin", "").replace("/", "") || "Dashboard Overview"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition bg-white shadow-xs font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">View Live Store</span>
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
