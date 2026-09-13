"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Star, ShoppingBag, Check, ShieldCheck, Clock, Sparkles } from "lucide-react";

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart }) {
  if (!isOpen || !product) return null;

  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.size || "3ml");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const activeVariant =
    product.variants.find((v) => v.size === selectedSize) || product.variants[0];

  const handleAdd = () => {
    onAddToCart({
      id: `${product.id}-${activeVariant.size}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      size: activeVariant.size,
      price: activeVariant.price,
      quantity: quantity,
    });
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-xs max-w-3xl w-full overflow-hidden shadow-2xl z-10 animate-scaleUp border border-stone-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image Viewer */}
          <div className="bg-[#f7f6f2] p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-stone-200">
            {product.saleBadge && (
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 text-xs uppercase font-bold tracking-wider bg-[#BC8242] text-white rounded-xs shadow-xs">
                {product.saleBadge}
              </span>
            )}
            <div className="relative w-full aspect-square max-w-sm">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-contain p-4"
              />
            </div>

            {/* Thumbnail switcher if secondary image exists */}
            {product.secondaryImage && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveImage(product.image)}
                  className={`w-12 h-12 rounded-xs border overflow-hidden p-1 bg-white ${
                    activeImage === product.image ? "border-[#BC8242] ring-1 ring-[#BC8242]" : "border-stone-300"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image src={product.image} alt={product.name} fill className="object-contain" />
                  </div>
                </button>
                <button
                  onClick={() => setActiveImage(product.secondaryImage)}
                  className={`w-12 h-12 rounded-xs border overflow-hidden p-1 bg-white ${
                    activeImage === product.secondaryImage ? "border-[#BC8242] ring-1 ring-[#BC8242]" : "border-stone-300"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image src={product.secondaryImage} alt={product.name} fill className="object-contain" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Right: Product Options & Details */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-5 max-h-[80vh] overflow-y-auto">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#BC8242] font-semibold block">
                {product.categoryDisplay}
              </span>

              <h2 className="text-2xl font-serif-luxury font-bold text-stone-900 mt-1 uppercase tracking-wide">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-stone-500">
                  {product.rating} ({product.reviewsCount} customer reviews)
                </span>
              </div>

              {/* Price display based on variant */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-2xl font-serif-luxury font-bold text-[#BC8242]">
                  Rs{activeVariant.price.toLocaleString()}.00
                </span>
                {activeVariant.regularPrice && (
                  <span className="text-sm text-stone-400 line-through">
                    Rs{activeVariant.regularPrice.toLocaleString()}.00
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-stone-600 leading-relaxed mt-3">
                {product.description}
              </p>

              {/* Fragrance Notes / Pyramid */}
              {product.pyramid && (
                <div className="mt-4 p-3 bg-stone-50 rounded-xs border border-stone-200/80 space-y-1.5 text-xs">
                  <div className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-[#BC8242]">
                    <Sparkles size={12} /> Fragrance Olfactory Notes
                  </div>
                  <div className="text-[11px] text-stone-600">
                    <strong>Top:</strong> {product.pyramid.top}
                  </div>
                  <div className="text-[11px] text-stone-600">
                    <strong>Heart:</strong> {product.pyramid.heart}
                  </div>
                  <div className="text-[11px] text-stone-600">
                    <strong>Base:</strong> {product.pyramid.base}
                  </div>
                </div>
              )}

              {/* Variant Selector */}
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-800 block mb-2">
                  Select Bottle Size / Presentation:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.size}
                      onClick={() => setSelectedSize(v.size)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xs border transition-all ${
                        selectedSize === v.size
                          ? "bg-stone-900 border-stone-900 text-white shadow-xs"
                          : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                      }`}
                    >
                      {v.size} - Rs{v.price.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="mt-4 flex items-center gap-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                  Qty:
                </label>
                <div className="flex items-center border border-stone-300 rounded-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1 text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-stone-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1 text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-stone-200 space-y-2">
              <button
                onClick={handleAdd}
                disabled={addedSuccess}
                className={`w-full py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                  addedSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-[#BC8242] hover:bg-[#a66f33] text-white"
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check size={16} /> Added To Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add To Cart — Rs{(activeVariant.price * quantity).toLocaleString()}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" /> 100% Pure Attar
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-emerald-600" /> 24h Longevity
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
