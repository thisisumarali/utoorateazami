"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { SITE_CONFIG } from "@/data/storeData";

export default function Navbar({
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
  onOpenSearch,
  activeCategory,
  onSelectCategory,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collectionDropdownOpen, setCollectionDropdownOpen] = useState(false);

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
            <a href="#" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-stone-900 flex items-center justify-center border-2 border-[#BC8242] shadow-sm shrink-0 transition-transform group-hover:scale-105">
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
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-[13px] font-semibold tracking-[0.15em] text-stone-800">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectCategory("all");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:text-[#BC8242] transition-colors"
            >
              HOME
            </a>
            <a
              href="#about"
              className="hover:text-[#BC8242] transition-colors"
            >
              BRAND
            </a>

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
                <ChevronDown size={14} className={`transition-transform duration-200 ${collectionDropdownOpen ? "rotate-180 text-[#BC8242]" : ""}`} />
              </button>

              {collectionDropdownOpen && (
                <div className="absolute top-full left-0 w-56 bg-white border border-stone-200 shadow-xl rounded-sm py-2 z-50 animate-fadeIn">
                  {collectionItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectCategory(item.id);
                        setCollectionDropdownOpen(false);
                        const section = document.getElementById("catalog-section");
                        if (section) section.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium tracking-wider transition-colors hover:bg-stone-50 hover:text-[#BC8242] flex items-center justify-between ${
                        activeCategory === item.id ? "text-[#BC8242] bg-amber-50/50 font-semibold" : "text-stone-700"
                      }`}
                    >
                      {item.label}
                      {activeCategory === item.id && <span className="w-1.5 h-1.5 rounded-full bg-[#BC8242]"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="#categories"
              className="hover:text-[#BC8242] transition-colors"
            >
              GALLERY
            </a>

            <a
              href="#footer"
              className="hover:text-[#BC8242] transition-colors"
            >
              CONTACT US
            </a>
          </nav>

          {/* Right Action Tools: Search, Cart */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-1.5 sm:p-2 text-stone-700 hover:text-[#BC8242] transition-colors rounded-full hover:bg-stone-100"
              aria-label="Search Fragrances"
              title="Search fragrances"
            >
              <Search size={18} />
            </button>

            {/* Cart Button: Full pill on sm+ screen, sleek compact badge on mobile */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:pl-3 sm:pr-4 py-1.5 rounded-full border border-stone-300 hover:border-[#BC8242] hover:bg-amber-50/40 text-stone-800 transition-all shadow-xs group"
              aria-label="View Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag size={17} className="text-[#BC8242] group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#BC8242] text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              {/* Full price text on desktop/tablet */}
              <span className="hidden sm:inline text-xs font-bold tracking-wider text-stone-800">
                CART / <span className="text-[#BC8242]">Rs{cartTotal.toLocaleString()}</span>
              </span>
              {/* Compact price on small mobile */}
              <span className="sm:hidden text-[11px] font-bold text-[#BC8242]">
                Rs{cartTotal.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 shadow-xl px-5 py-4 space-y-3 animate-fadeIn">
          <div className="flex flex-col space-y-2.5 text-sm font-semibold tracking-wider text-stone-800">
            <a
              href="#"
              onClick={() => {
                onSelectCategory("all");
                setMobileMenuOpen(false);
              }}
              className="py-1 hover:text-[#BC8242] transition-colors"
            >
              HOME
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#BC8242] transition-colors"
            >
              BRAND
            </a>

            <div className="pt-1 pb-1">
              <div className="text-[11px] uppercase tracking-widest text-[#BC8242] font-bold mb-1.5">
                COLLECTIONS
              </div>
              <div className="pl-3 space-y-1.5 border-l-2 border-stone-200">
                {collectionItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectCategory(item.id);
                      setMobileMenuOpen(false);
                      const sec = document.getElementById("catalog-section");
                      if (sec) sec.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`block text-xs py-1 text-left w-full transition-colors ${
                      activeCategory === item.id ? "text-[#BC8242] font-bold" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <a
              href="#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#BC8242] transition-colors"
            >
              GALLERY
            </a>
            <a
              href="#footer"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#BC8242] transition-colors"
            >
              CONTACT US
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
