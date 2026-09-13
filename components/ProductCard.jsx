"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, ShoppingBag, Check } from "lucide-react";

export default function ProductCard({
  product,
  onQuickView,
  onAddToCart,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.size || "3ml");
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Find active variant
  const activeVariant =
    product.variants.find((v) => v.size === selectedSize) || product.variants[0];

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    onAddToCart({
      id: `${product.id}-${activeVariant.size}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      size: activeVariant.size,
      price: activeVariant.price,
      quantity: 1,
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1600);
  };

  return (
    <div
      className="group flex flex-col bg-transparent cursor-pointer transition-all duration-300 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onQuickView(product)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f7f6f2] rounded-xs border border-stone-200/80 transition-shadow group-hover:shadow-md">
        {/* Sale Badge */}
        {product.saleBadge && (
          <span className="absolute top-2 left-2 z-20 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-[#BC8242] text-white rounded-xs shadow-xs">
            {product.saleBadge}
          </span>
        )}

        {/* Product Image with smooth hover scale */}
        <div className="relative w-full h-full p-2 sm:p-4 flex items-center justify-center">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 25vw"
            className={`object-contain transition-transform duration-500 ease-out p-1.5 sm:p-3 ${
              isHovered ? "scale-108" : "scale-100"
            }`}
          />
        </div>

        {/* Desktop Quick Action Overlay on Hover */}
        <div
          className={`hidden sm:flex absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-white/95 via-white/80 to-transparent flex-col gap-2 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          {/* Quick Size Pills */}
          {product.variants.length > 1 && (
            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {product.variants.map((v) => (
                <button
                  key={v.size}
                  onClick={() => setSelectedSize(v.size)}
                  className={`text-[10px] px-2 py-0.5 rounded-xs font-semibold tracking-wider transition-colors ${
                    selectedSize === v.size
                      ? "bg-stone-900 text-white"
                      : "bg-stone-200/80 text-stone-700 hover:bg-stone-300"
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={handleQuickAdd}
              disabled={addedAnimation}
              className={`flex-1 py-1.5 px-2 rounded-xs text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-all uppercase shadow-xs ${
                addedAnimation
                  ? "bg-emerald-600 text-white"
                  : "bg-[#BC8242] hover:bg-[#a1682a] text-white"
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : (
                <>
                  <ShoppingBag size={13} /> Add To Cart
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xs transition-colors"
              title="Quick View Details"
            >
              <Eye size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Details - Simple, Neat, Clean (just like user reference) */}
      <div className="pt-2 sm:pt-3 pb-1 text-left">
        <h3 className="text-xs sm:text-sm md:text-base font-serif-luxury font-medium text-stone-900 tracking-wide group-hover:text-[#BC8242] transition-colors truncate">
          {product.name}
        </h3>

        <div className="flex items-baseline justify-between gap-1 mt-0.5 sm:mt-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-stone-800 tracking-wider">
              {product.priceDisplay}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] text-stone-400 line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Mobile Dedicated Touch Actions (visible on mobile only) */}
        <div className="mt-2 sm:hidden flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-1.5 px-2 bg-stone-900 text-white active:bg-[#BC8242] text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
          >
            <ShoppingBag size={11} /> Select Size
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-1.5 bg-stone-100 text-stone-700 active:bg-stone-200 border border-stone-200 rounded-xs transition-colors shrink-0"
            aria-label="View product details"
          >
            <Eye size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
