"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { SITE_CONFIG } from "@/data/storeData";
import { useCart } from "@/context/CartContext";

export default function Navbar({
  cartCount: propCartCount,
  cartTotal: propCartTotal,
  onOpenCart,
  onOpenSearch,
  activeCategory = "all",
  onSelectCategory,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collectionDropdownOpen, setCollectionDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  let cartCtx = null;
  try {
    cartCtx = useCart();
  } catch (e) {
    // Fallback if rendered outside provider
  }

  const effectiveCartCount =
    propCartCount !== undefined ? propCartCount : cartCtx?.cartCount ?? 0;
  const effectiveCartTotal =
    propCartTotal !== undefined ? propCartTotal : cartCtx?.cartTotal ?? 0;

  const handleCartClick = () => {
    if (onOpenCart) onOpenCart();
    else if (cartCtx?.setIsCartOpen) cartCtx.setIsCartOpen(true);
  };

  const handleSearchClick = () => {
    if (onOpenSearch) onOpenSearch();
    else if (cartCtx?.setIsSearchOpen) cartCtx.setIsSearchOpen(true);
  };

  const handleCategoryClick = (catId) => {
    setCollectionDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onSelectCategory && pathname === "/") {
      onSelectCategory(catId);
      const section = document.getElementById("catalog-section");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/shop?category=${catId}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const collectionItems = [
    { label: "All Fragrances", id: "all" },
    { label: "Azamis Special", id: "azamis-special" },
    { label: "Best Sellers", id: "best-seller" },
    { label: "Men's Collection", id: "mens" },
    { label: "Oud Collection", id: "oud" },
    { label: "Unisex Fragrances", id: "unisex" },
    { label: "Luxury Gift Sets", id: "gift-set" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="bg-[#1c1917] text-[#fbf8f3] text-[10px] sm:text-xs py-1.5 sm:py-2 px-3 text-center tracking-wider font-medium flex items-center justify-center">
        <span className="truncate">{SITE_CONFIG.announcement}</span>
      </div>

      {/* Main Navbar */}
      <div
        className={`w-full bg-white/95 backdrop-blur-md transition-all border-b border-stone-200 ${
          isScrolled ? "shadow-md py-2" : "py-2.5 sm:py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-stone-800 hover:text-[#BC8242] transition-colors rounded-xs focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Logo / Brand Name */}
          <div className="flex items-center min-w-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 overflow-hidden flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src={SITE_CONFIG.logoUrl}
                  alt={SITE_CONFIG.name}
                  width={48}
                  height={48}
                  className="object-contain p-0.5"
                  priority
                />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="font-serif-luxury text-sm sm:text-base md:text-xl font-bold tracking-[0.06em] sm:tracking-[0.14em] text-stone-900 group-hover:text-[#BC8242] transition-colors uppercase whitespace-nowrap">
                  UTOORAT E AZAMI
                </span>
                <span className="text-[8px] sm:text-[10px] tracking-[0.2em] text-[#BC8242] uppercase font-semibold leading-none">
                  {SITE_CONFIG.arabicName}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-[13px] font-semibold tracking-[0.15em] text-stone-800">
            <Link
              href="/"
              className={`hover:text-[#BC8242] transition-colors ${
                pathname === "/" ? "text-[#BC8242] border-b border-[#BC8242]" : ""
              }`}
            >
              HOME
            </Link>

            <Link
              href="/shop"
              className={`hover:text-[#BC8242] transition-colors flex items-center gap-1 ${
                pathname.startsWith("/shop")
                  ? "text-[#BC8242] border-b border-[#BC8242]"
                  : ""
              }`}
            >
              SHOP
              <span className="text-[9px] px-1 py-0.2 bg-[#BC8242] text-white rounded font-bold uppercase tracking-normal">
                All
              </span>
            </Link>

            {/* Collection Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCollectionDropdownOpen(true)}
              onMouseLeave={() => setCollectionDropdownOpen(false)}
            >
              <button
                className="flex items-center gap-1 hover:text-[#BC8242] transition-colors py-2 focus:outline-none"
                onClick={() => setCollectionDropdownOpen(!collectionDropdownOpen)}
              >
                COLLECTION
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    collectionDropdownOpen ? "rotate-180 text-[#BC8242]" : ""
                  }`}
                />
              </button>

              {collectionDropdownOpen && (
                <div className="absolute top-full left-0 w-56 bg-white border border-stone-200 shadow-xl rounded-sm py-2 z-50 animate-fadeIn">
                  {collectionItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleCategoryClick(item.id)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium tracking-wider transition-colors hover:bg-stone-50 hover:text-[#BC8242] flex items-center justify-between ${
                        activeCategory === item.id
                          ? "text-[#BC8242] bg-amber-50/50 font-semibold"
                          : "text-stone-700"
                      }`}
                    >
                      {item.label}
                      {activeCategory === item.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BC8242]"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/#about"
              className="hover:text-[#BC8242] transition-colors"
            >
              BRAND
            </Link>

            <Link
              href="/#categories"
              className="hover:text-[#BC8242] transition-colors"
            >
              GALLERY
            </Link>

            <Link
              href="/contact"
              className={`hover:text-[#BC8242] transition-colors ${
                pathname === "/contact"
                  ? "text-[#BC8242] border-b border-[#BC8242]"
                  : ""
              }`}
            >
              CONTACT US
            </Link>
          </nav>

          {/* Right Action Tools: Search, Cart */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={handleSearchClick}
              className="p-1.5 sm:p-2 text-stone-700 hover:text-[#BC8242] transition-colors rounded-full hover:bg-stone-100"
              aria-label="Search Fragrances"
              title="Search fragrances"
            >
              <Search size={18} />
            </button>

            {/* Cart Button: Full pill on sm+ screen, sleek compact badge on mobile */}
            <button
              onClick={handleCartClick}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:pl-3 sm:pr-4 py-1.5 rounded-full border border-stone-300 hover:border-[#BC8242] hover:bg-amber-50/40 text-stone-800 transition-all shadow-xs group"
              aria-label="View Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag
                  size={17}
                  className="text-[#BC8242] group-hover:scale-110 transition-transform"
                />
                {effectiveCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#BC8242] text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold">
                    {effectiveCartCount}
                  </span>
                )}
              </div>
              {/* Full price text on desktop/tablet */}
              <span className="hidden sm:inline text-xs font-bold tracking-wider text-stone-800">
                CART /{" "}
                <span className="text-[#BC8242]">
                  Rs{effectiveCartTotal.toLocaleString()}
                </span>
              </span>
              {/* Compact price on small mobile */}
              <span className="sm:hidden text-[11px] font-bold text-[#BC8242]">
                Rs{effectiveCartTotal.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 shadow-xl px-5 py-4 space-y-3 animate-fadeIn">
          <div className="flex flex-col space-y-2.5 text-sm font-semibold tracking-wider text-stone-800">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#BC8242] transition-colors"
            >
              HOME
            </Link>

            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[#BC8242] font-bold flex items-center justify-between"
            >
              <span>SHOP ALL PRODUCTS</span>
              <span className="text-[10px] px-2 py-0.5 bg-[#BC8242] text-white rounded font-bold uppercase">
                Browse
              </span>
            </Link>

            <div className="pt-1 pb-1">
              <div className="text-[11px] uppercase tracking-widest text-[#BC8242] font-bold mb-1.5">
                COLLECTIONS
              </div>
              <div className="pl-3 space-y-1.5 border-l-2 border-stone-200">
                {collectionItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCategoryClick(item.id)}
                    className={`block text-xs py-1 text-left w-full transition-colors ${
                      activeCategory === item.id
                        ? "text-[#BC8242] font-bold"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#BC8242] transition-colors"
            >
              BRAND
            </Link>

            <Link
              href="/#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#BC8242] transition-colors"
            >
              GALLERY
            </Link>

            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-1 hover:text-[#BC8242] transition-colors ${
                pathname === "/contact" ? "text-[#BC8242] font-bold" : ""
              }`}
            >
              CONTACT US
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

