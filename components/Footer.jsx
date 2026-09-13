"use client";

import { useState } from "react";
import Image from "next/image";
import { Send, Phone, Mail, MapPin, Check } from "lucide-react";
import { SITE_CONFIG } from "@/data/storeData";

export default function Footer({ onSelectCategory }) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail("");
    }, 2000);
  };

  return (
    <footer id="footer" className="bg-[#f7f5f0] border-t border-stone-200 text-stone-700 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-12 border-b border-stone-200">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-900 flex items-center justify-center border border-[#BC8242] p-1">
                <Image
                  src={SITE_CONFIG.logoUrl}
                  alt={SITE_CONFIG.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-serif-luxury text-lg font-bold tracking-wider text-stone-900 uppercase block">
                  Utoorat e Azami
                </span>
                <span className="text-[10px] tracking-[0.2em] text-[#BC8242] uppercase font-semibold">
                  {SITE_CONFIG.arabicName}
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Timeless Collections For Essence Enthusiasts. We craft 100% pure non-alcoholic concentrated perfume oils and artisanal attars celebrating traditional oriental perfumery.
            </p>
            <div className="pt-2 text-xs space-y-1.5 text-stone-600">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#BC8242]" />
                <span>WhatsApp: +92 300 1234567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#BC8242]" />
                <span>support@utoorateazami.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#BC8242]" />
                <span>Nationwide Shipping Across Pakistan</span>
              </div>
            </div>
          </div>

          {/* Quick Collections */}
          <div className="space-y-3">
            <h4 className="font-serif-luxury text-sm font-bold text-stone-900 uppercase tracking-widest pb-2 border-b border-stone-200">
              Collections
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { name: "Azamis Special", id: "azamis-special" },
                { name: "Best Sellers", id: "best-seller" },
                { name: "Men's Attars", id: "mens" },
                { name: "Pure Aged Oud", id: "oud" },
                { name: "Unisex Fragrances", id: "unisex" },
                { name: "Luxury Gift Sets", id: "gift-set" },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(item.id);
                      const sec = document.getElementById("catalog-section");
                      if (sec) sec.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-[#BC8242] transition-colors"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-serif-luxury text-sm font-bold text-stone-900 uppercase tracking-widest pb-2 border-b border-stone-200">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs text-stone-600">
              <li>
                <a href="#about" className="hover:text-[#BC8242] transition-colors">
                  About Our House
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#BC8242] transition-colors">
                  Shipping & Delivery Info
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#BC8242] transition-colors">
                  Authenticity & Non-Alcoholic Guarantee
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#BC8242] transition-colors">
                  How To Apply Attars Properly
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#BC8242] transition-colors">
                  Corporate & Wedding Gifting
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="font-serif-luxury text-sm font-bold text-stone-900 uppercase tracking-widest pb-2 border-b border-stone-200">
              Join The Inner Circle
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Subscribe to receive exclusive access to new seasonal attar drops, private releases, and 10% off your first order.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xs focus:outline-none focus:border-[#BC8242] bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#BC8242] hover:bg-[#a66f33] text-white text-xs font-semibold rounded-xs transition-colors shrink-0 flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <Send size={14} />
                </button>
              </div>
              {subscribed && (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={12} /> Thank you for subscribing!
                </p>
              )}
            </form>

            <div className="pt-2 text-[11px] text-stone-500">
              Accepted Payments: Cash on Delivery (COD), Bank Transfer, JazzCash, EasyPaisa.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Utoorat e Azami (عطور الأعظمي). All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-stone-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Track Order</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
