"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { X, Star, ShoppingBag, Check, ShieldCheck, Clock, Sparkles, ZoomIn, Maximize2, AlertCircle } from "lucide-react";

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart }) {
  const variants = useMemo(() => {
    if (Array.isArray(product?.variants)) return product.variants;
    if (typeof product?.variants === "string") {
      try {
        return JSON.parse(product.variants);
      } catch (e) {}
    }
    return [
      { size: "3ml", price: 500, inStock: true },
      { size: "6ml", price: 1000, inStock: true },
      { size: "12ml", price: 2000, inStock: true },
    ];
  }, [product?.variants]);

  // Helper to determine if a variant is in stock
  const isVariantInStock = (v) => {
    if (!v) return false;
    if (product?.in_stock === false || product?.inStock === false) return false;
    if (v.inStock === false || v.in_stock === false) return false;
    if (v.status === "Out of Stock" || v.status === "out_of_stock") return false;
    return true;
  };

  // Default to first AVAILABLE in-stock variant; fallback to first variant if all out of stock
  const defaultSize =
    variants.find((v) => isVariantInStock(v))?.size || variants[0]?.size || "3ml";

  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product?.image || "");
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Derive guaranteed non-empty image source
  const displayImage = activeImage || product?.image || null;

  // Sync state whenever active product changes
  useEffect(() => {
    if (product) {
      const availSize =
        variants.find((v) => isVariantInStock(v))?.size || variants[0]?.size || "3ml";
      setSelectedSize(availSize);
      setQuantity(1);
      setActiveImage(product.image || "");
      setIsLightboxOpen(false);
    }
  }, [product, variants]);

  // Handle ESC key to dismiss modal or lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLightboxOpen, onClose]);

  if (!isOpen || !product) return null;

  const activeVariant =
    variants.find((v) => v.size === selectedSize) || variants[0] || { size: "3ml", price: 500 };
  const isCurrentVariantInStock = isVariantInStock(activeVariant);

  const handleAdd = () => {
    if (!isCurrentVariantInStock) return;
    onAddToCart({
      id: `${product.id}-${activeVariant.size}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      size: activeVariant.size,
      price: activeVariant.price,
      quantity: quantity,
      inStock: true,
    });
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container: Bottom sheet on mobile, centered modal on desktop */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-xs max-w-3xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl z-10 border border-stone-200 animate-slideUp sm:animate-scaleUp">
        {/* Mobile Header with visible close button */}
        <div className="sm:hidden flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200 shrink-0">
          <span className="text-xs uppercase tracking-wider text-[#BC8242] font-bold truncate">
            {product.categoryDisplay}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-200/80 rounded-full active:bg-stone-300 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden sm:flex absolute top-3 right-3 z-30 p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Product Image */}
            <div className="bg-[#f7f6f2] p-4 sm:p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-stone-200">
              {product.saleBadge && (
                <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#BC8242] text-white rounded-xs shadow-xs">
                  {product.saleBadge}
                </span>
              )}

              <div
                onClick={() => setIsLightboxOpen(true)}
                className="relative w-full h-64 sm:h-80 md:h-[350px] max-w-sm flex items-center justify-center cursor-zoom-in group/zoom"
                title="Click to open full image"
              >
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-1 transition-transform duration-300 group-hover/zoom:scale-105"
                  />
                ) : null}

                {/* Subtle Hover Zoom Pill */}
                <div className="absolute bottom-2 right-2 z-10 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-stone-800 text-[11px] font-semibold flex items-center gap-1.5 shadow-md border border-stone-200/80 backdrop-blur-xs transition-all opacity-85 group-hover/zoom:opacity-100">
                  <ZoomIn size={13} className="text-[#BC8242]" />
                  <span>Click to expand</span>
                </div>
              </div>

              {/* Thumbnail switcher if secondary image exists */}
              {product.secondaryImage && (
                <div className="flex gap-2 mt-2 sm:mt-4">
                  <button
                    onClick={() => setActiveImage(product.image)}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xs border overflow-hidden p-1 bg-white transition-all ${
                      displayImage === product.image ? "border-[#BC8242] ring-2 ring-[#BC8242]/40 scale-105" : "border-stone-300 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="relative w-full h-full">
                      <Image src={product.image} alt={product.name} fill sizes="56px" className="object-contain" />
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveImage(product.secondaryImage)}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xs border overflow-hidden p-1 bg-white transition-all ${
                      displayImage === product.secondaryImage ? "border-[#BC8242] ring-2 ring-[#BC8242]/40 scale-105" : "border-stone-300 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="relative w-full h-full">
                      <Image src={product.secondaryImage} alt={product.name} fill sizes="56px" className="object-contain" />
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Product Details & Options */}
            <div className="p-4 sm:p-6 md:p-8 flex flex-col space-y-4">
              <div>
                <span className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-[#BC8242] font-semibold">
                  {product.categoryDisplay}
                </span>

                <h2 className="text-xl sm:text-2xl font-serif-luxury font-bold text-stone-900 uppercase tracking-wide">
                  {product.name}
                </h2>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] sm:text-xs text-stone-500">
                    {product.rating} ({product.reviewsCount} reviews)
                  </span>
                </div>

                {/* Optional Inspiration Note */}
                {product.inspiredBy && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#925c24] bg-[#fbf7f0] border border-[#BC8242]/30 px-2.5 py-1 rounded-xs mt-2.5 shadow-xs">
                    <Sparkles size={12} className="text-[#BC8242] shrink-0" />
                    <span>{product.inspiredBy}</span>
                  </div>
                )}

                {/* Price display based on variant */}
                <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-serif-luxury font-bold text-[#BC8242]">
                    Rs{activeVariant.price.toLocaleString()}.00
                  </span>
                  {activeVariant.regularPrice && (
                    <span className="text-xs sm:text-sm text-stone-400 line-through">
                      Rs{activeVariant.regularPrice.toLocaleString()}.00
                    </span>
                  )}
                  {!isCurrentVariantInStock && (
                    <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-xs bg-rose-50 text-rose-700 border border-rose-200">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 leading-relaxed mt-2.5">
                  {product.description}
                </p>

                {/* Fragrance Notes / Pyramid - Only shown if notes are actually provided */}
                {product.pyramid && (product.pyramid.top?.trim() || product.pyramid.heart?.trim() || product.pyramid.base?.trim()) && (
                  <div className="mt-3 p-2.5 sm:p-3 bg-stone-50 rounded-xs border border-stone-200/80 space-y-1 text-xs">
                    <div className="font-semibold text-stone-800 text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1 text-[#BC8242]">
                      <Sparkles size={12} /> Olfactory Notes
                    </div>
                    {product.pyramid.top?.trim() && (
                      <div className="text-[11px] text-stone-600">
                        <strong>Top:</strong> {product.pyramid.top}
                      </div>
                    )}
                    {product.pyramid.heart?.trim() && (
                      <div className="text-[11px] text-stone-600">
                        <strong>Heart:</strong> {product.pyramid.heart}
                      </div>
                    )}
                    {product.pyramid.base?.trim() && (
                      <div className="text-[11px] text-stone-600">
                        <strong>Base:</strong> {product.pyramid.base}
                      </div>
                    )}
                  </div>
                )}

                {/* Variant Selector */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-stone-800">
                      Select Bottle Size / Presentation:
                    </label>
                    {!isCurrentVariantInStock && (
                      <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle size={11} /> Size unavailable
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {variants.map((v) => {
                      const inStock = isVariantInStock(v);
                      const isSelected = selectedSize === v.size;
                      return (
                        <button
                          key={v.size}
                          onClick={() => setSelectedSize(v.size)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? !inStock
                                ? "bg-stone-800 border-stone-800 text-stone-200 shadow-xs"
                                : "bg-stone-900 border-stone-900 text-white shadow-xs"
                              : !inStock
                              ? "border-stone-200 bg-stone-100/80 text-stone-400 hover:border-stone-300"
                              : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                          }`}
                        >
                          <span className={!inStock && !isSelected ? "line-through" : ""}>
                            {v.size} - Rs{v.price.toLocaleString()}
                          </span>
                          {!inStock && (
                            <span className="text-[9px] uppercase font-bold text-rose-700 bg-rose-100/90 px-1 py-0.2 rounded">
                              Sold Out
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Quantity Stepper */}
                <div
                  className={`hidden sm:flex items-center gap-3 mt-3 transition-opacity ${
                    !isCurrentVariantInStock ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                    Qty:
                  </label>
                  <div className="flex items-center border border-stone-300 rounded-xs">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={!isCurrentVariantInStock}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-2.5 py-1 text-xs font-bold text-stone-800">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      disabled={!isCurrentVariantInStock}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer Bar (guaranteed visible and tapable on all screens) */}
        <div className="border-t border-stone-200 bg-white p-3 sm:p-4 z-20 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Quantity Stepper */}
            <div
              className={`sm:hidden flex items-center border border-stone-300 rounded-xs shrink-0 ${
                !isCurrentVariantInStock ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={!isCurrentVariantInStock}
                className="px-2 py-2 text-stone-600 active:bg-stone-100"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="px-2 text-xs font-bold text-stone-800">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                disabled={!isCurrentVariantInStock}
                className="px-2 py-2 text-stone-600 active:bg-stone-100"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAdd}
              disabled={!isCurrentVariantInStock || addedSuccess}
              className={`flex-1 py-2.5 sm:py-3 px-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                !isCurrentVariantInStock
                  ? "bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed shadow-none"
                  : addedSuccess
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-[#BC8242] hover:bg-[#a66f33] active:bg-[#925c27] text-white shadow-md"
              }`}
            >
              {!isCurrentVariantInStock ? (
                <>
                  <AlertCircle size={15} /> Out of Stock ({activeVariant.size})
                </>
              ) : addedSuccess ? (
                <>
                  <Check size={16} /> Added!
                </>
              ) : (
                <>
                  <ShoppingBag size={15} /> Add To Cart — Rs{(activeVariant.price * quantity).toLocaleString()}
                </>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" /> 100% Pure Non-Alcoholic Attar
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-emerald-600" /> 24h Longevity
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header Bar */}
          <div className="absolute top-4 inset-x-0 px-6 flex items-center justify-between z-30">
            <div>
              <span className="text-white text-base sm:text-lg font-serif-luxury font-bold tracking-wider uppercase block">
                {product.name}
              </span>
              {product.inspiredBy && (
                <span className="text-amber-300 text-xs font-medium">
                  {product.inspiredBy}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/35 text-white transition-colors cursor-pointer"
              aria-label="Close full view"
            >
              <X size={24} />
            </button>
          </div>

          {/* Full Resolution Image Container */}
          <div
            className="relative max-w-4xl w-full h-[72vh] sm:h-[80vh] flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {displayImage ? (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 95vw, 1200px"
                className="object-contain drop-shadow-2xl"
                priority
              />
            ) : null}
          </div>

          {/* Thumbnails switcher in lightbox */}
          {product.secondaryImage && (
            <div
              className="relative z-30 flex items-center gap-3 mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveImage(product.image)}
                className={`w-14 h-14 rounded-xs border-2 overflow-hidden p-1 bg-white transition-all cursor-pointer ${
                  displayImage === product.image
                    ? "border-[#BC8242] scale-105 ring-2 ring-[#BC8242]"
                    : "border-white/40 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="relative w-full h-full">
                  <Image src={product.image} alt={product.name} fill sizes="60px" className="object-contain" />
                </div>
              </button>
              <button
                onClick={() => setActiveImage(product.secondaryImage)}
                className={`w-14 h-14 rounded-xs border-2 overflow-hidden p-1 bg-white transition-all cursor-pointer ${
                  displayImage === product.secondaryImage
                    ? "border-[#BC8242] scale-105 ring-2 ring-[#BC8242]"
                    : "border-white/40 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="relative w-full h-full">
                  <Image src={product.secondaryImage} alt={product.name} fill sizes="60px" className="object-contain" />
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
