"use client";

import { useState } from "react";
import { SITE_CONFIG } from "@/data/storeData";

export default function WhatsAppButton() {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(SITE_CONFIG.whatsappMessage);
    window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed bottom-4 right-3.5 sm:bottom-6 sm:right-6 z-40 flex items-center group">
      {/* Tooltip badge */}
      <div
        className={`hidden sm:flex items-center gap-2 mr-3 px-3.5 py-2 bg-white text-stone-800 text-xs font-semibold rounded-full shadow-lg border border-stone-200 transition-all duration-300 ${
          tooltipOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Need scent advice? Chat on WhatsApp</span>
      </div>

      {/* Floating Button */}
      <button
        onClick={handleOpenWhatsApp}
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa4f] text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <svg
          viewBox="0 0 32 32"
          className="w-6 h-6 sm:w-8 sm:h-8 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.64.73 5.11 2 7.23L2 30l7-1.92A13.9 13.9 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm8.17 19.83c-.34.96-1.7 1.83-2.77 2.05-.73.15-1.68.27-4.88-1.05-4.08-1.69-6.72-5.83-6.93-6.1-.2-.28-1.67-2.22-1.67-4.24s1.05-3.02 1.43-3.43c.38-.41.83-.51 1.1-.51.28 0 .55 0 .79.02.25.01.59-.1.92.7.34.82 1.17 2.85 1.27 3.06.1.2.17.44.03.71-.13.27-.2.44-.41.68-.2.24-.43.53-.61.71-.2.2-.42.42-.18.83.24.41 1.07 1.76 2.3 2.85 1.58 1.41 2.91 1.85 3.32 2.05.41.2.65.17.89-.1.24-.28 1.02-1.19 1.29-1.6.27-.41.55-.34.92-.2.38.14 2.38 1.12 2.79 1.33.41.2.68.31.78.48.1.17.1.99-.24 1.95z" />
        </svg>
      </button>
    </div>
  );
}
