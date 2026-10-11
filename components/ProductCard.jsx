"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, ShoppingBag, Check, Sparkles, Maximize2 } from "lucide-react";

export default function ProductCard({
  product,
  onQuickView,
  onAddToCart,
}) {
  const router = useRouter();

  // Parse variants cleanly
  const variants = useMemo(() => {
    let raw = product.variants;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = [];
      }
    }
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((v) => ({
        size: v.size || "Standard",
        price: parseFloat(v.price) || 0,
        regularPrice: v.regularPrice ? parseFloat(v.regularPrice) : null,
        inStock: v.inStock !== false && v.in_stock !== false && v.status !== "Out of Stock" && v.status !== "out_of_stock",
      }));
    }

    const minP = parseFloat(product.min_price || product.minPrice) || 500;
    const maxP = parseFloat(product.max_price || product.maxPrice) || minP;
    if (minP === maxP) {
      return [{ size: "Standard", price: minP, inStock: true }];
    }
    return [
      { size: "3ml", price: minP, inStock: true },
      { size: "6ml", price: Math.round(minP * 2), inStock: true },
      { size: "12ml", price: maxP, inStock: true },
    ];
  }, [product.variants, product.min_price, product.minPrice, product.max_price, product.maxPrice]);

  // Clean, guaranteed price range (e.g. "Rs400 – Rs1,600")
  const rangeDisplay = useMemo(() => {
    const prices = variants.map((v) => v.price).filter((p) => p > 0);
    let min = prices.length > 0 ? Math.min(...prices) : (parseFloat(product.min_price || product.minPrice) || 500);
    let max = prices.length > 0 ? Math.max(...prices) : (parseFloat(product.max_price || product.maxPrice) || min);

    if (min === max) {
      return `Rs${min.toLocaleString()}`;
    }
    return `Rs${min.toLocaleString()} – Rs${max.toLocaleString()}`;
  }, [variants, product.min_price, product.minPrice, product.max_price, product.maxPrice]);

  // Helper to check stock status
  const isVariantInStock = (v) => {
    if (!v) return false;
    if (product.in_stock === false || product.inStock === false) return false;
    if (v.inStock === false || v.in_stock === false) return false;
    if (v.status === "Out of Stock" || v.status === "out_of_stock") return false;
    return true;
  };

  // Check overall product stock (no variants in stock)
  const isProductOutOfStock =
    product.in_stock === false ||
    product.inStock === false ||
    (variants.length > 0 && variants.every((v) => !isVariantInStock(v)));

  // Pick first available in-stock variant by default
  const defaultVariant = useMemo(() => {
    return variants.find((v) => isVariantInStock(v)) || variants[0] || { size: "3ml", price: 500 };
  }, [variants, product.in_stock, product.inStock]);

  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(defaultVariant?.size || "3ml");
  const [hasUserSelectedVariant, setHasUserSelectedVariant] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Sync selected size if default available variant changes
  useEffect(() => {
    if (defaultVariant?.size && !hasUserSelectedVariant) {
      setSelectedSize(defaultVariant.size);
    }
  }, [defaultVariant?.size, hasUserSelectedVariant]);

  // Find active variant
  const activeVariant =
    variants.find((v) => v.size === selectedSize) || defaultVariant;
  const isCurrentVariantInStock = isVariantInStock(activeVariant);

  const handleSelectSize = (e, size) => {
    e.stopPropagation();
    setSelectedSize(size);
    setHasUserSelectedVariant(true);
  };

  const navigateToProduct = (e) => {
    if (e) e.stopPropagation();
    router.push(`/product/${product.id}`);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (!isCurrentVariantInStock) return;
    if (onAddToCart) {
      onAddToCart({
        id: `${product.id}-${activeVariant.size}`,
        productId: product.id,
        name: product.name,
        image: product.image,
        size: activeVariant.size,
        price: activeVariant.price,
        quantity: 1,
        inStock: true,
      });
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1600);
    } else {
      navigateToProduct(e);
    }
  };

  return (
    <div
      className="group flex flex-col bg-transparent cursor-pointer transition-all duration-300 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={navigateToProduct}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f7f6f2] rounded-xs border border-stone-200/80 transition-shadow group-hover:shadow-md">
        {/* Out of Stock or Sale Badge */}
        {isProductOutOfStock ? (
          <span className="absolute top-2 left-2 z-20 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-stone-900/90 text-white rounded-xs shadow-xs border border-white/20">
            Out of Stock
          </span>
        ) : (product.sale_badge || product.saleBadge) ? (
          <span className="absolute top-2 left-2 z-20 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-[#BC8242] text-white rounded-xs shadow-xs">
            {product.sale_badge || product.saleBadge}
          </span>
        ) : null}

        {/* Quick View / Full Page Trigger */}
        <button
          onClick={navigateToProduct}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-[#BC8242] shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="View Product Page"
          aria-label="View product page"
        >
          <Maximize2 size={13} />
        </button>

        {/* Product Image with smooth hover scale */}
        <div className="relative w-full h-full p-1 sm:p-2 flex items-center justify-center">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain transition-transform duration-500 ease-out p-0.5 ${
              isProductOutOfStock ? "grayscale-[20%] opacity-85" : ""
            } ${isHovered ? "scale-108" : "scale-100"}`}
          />
        </div>

        {/* Desktop Quick Action Overlay on Hover */}
        <div
          className={`hidden sm:flex absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-white/95 via-white/80 to-transparent flex-col gap-2 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          {/* Quick Size Pills */}
          {variants.length > 1 && (
            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {variants.map((v) => {
                const inStock = isVariantInStock(v);
                const isSelected = selectedSize === v.size && hasUserSelectedVariant;
                return (
                  <button
                    key={v.size}
                    onClick={(e) => handleSelectSize(e, v.size)}
                    className={`text-[10px] px-2 py-0.5 rounded-xs font-semibold tracking-wider transition-colors cursor-pointer ${
                      isSelected
                        ? inStock
                          ? "bg-stone-900 text-white shadow-xs"
                          : "bg-rose-900 text-rose-100"
                        : inStock
                        ? "bg-white text-stone-700 hover:bg-stone-200 border border-stone-200/80"
                        : "bg-stone-200/60 text-stone-400 line-through"
                    }`}
                    title={inStock ? `${v.size} — Rs${v.price}` : `${v.size} (Out of stock)`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={handleQuickAdd}
              disabled={addedAnimation || !isCurrentVariantInStock}
              className={`flex-1 py-1.5 px-2 rounded-xs text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-all uppercase shadow-xs cursor-pointer ${
                !isCurrentVariantInStock
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed border border-stone-300"
                  : addedAnimation
                  ? "bg-emerald-600 text-white"
                  : "bg-[#BC8242] hover:bg-[#a1682a] text-white"
              }`}
            >
              {!isCurrentVariantInStock ? (
                <span>Sold Out</span>
              ) : addedAnimation ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : (
                <>
                  <ShoppingBag size={13} />
                  <span>
                    {hasUserSelectedVariant ? `Add ${activeVariant.size} — Rs${activeVariant.price.toLocaleString()}` : "Add To Bag"}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={navigateToProduct}
              className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xs transition-colors cursor-pointer"
              title="View Product Page"
            >
              <Eye size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="pt-2 sm:pt-3 pb-1 text-left flex flex-col flex-1">
        <Link
          href={`/product/${product.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs sm:text-sm md:text-base font-serif-luxury font-medium text-stone-900 tracking-wide group-hover:text-[#BC8242] transition-colors truncate block"
        >
          {product.name}
        </Link>

        {/* Optional Inspired-by Note */}
        {(product.inspired_by || product.inspiredBy) && (
          <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#925c24] bg-[#fbf7f0] border border-[#BC8242]/25 px-1.5 py-0.5 rounded-xs tracking-tight shadow-xs group-hover:border-[#BC8242]/45 transition-colors">
            <Sparkles size={10} className="text-[#BC8242] shrink-0" />
            <span className="truncate">{product.inspired_by || product.inspiredBy}</span>
          </div>
        )}

        {/* Mobile Variant Pills */}
        {variants.length > 1 && (
          <div className="flex sm:hidden items-center gap-1 mt-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {variants.map((v) => {
              const inStock = isVariantInStock(v);
              const isSelected = selectedSize === v.size && hasUserSelectedVariant;
              return (
                <button
                  key={v.size}
                  onClick={(e) => handleSelectSize(e, v.size)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-xs font-semibold tracking-wider transition-colors ${
                    isSelected
                      ? inStock
                        ? "bg-stone-900 text-white"
                        : "bg-rose-900 text-white"
                      : inStock
                      ? "bg-stone-100 text-stone-700 border border-stone-200"
                      : "bg-stone-100 text-stone-400 line-through border border-stone-200"
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-baseline justify-between gap-1 mt-1 sm:mt-1.5">
          {hasUserSelectedVariant ? (
            /* User clicked a variant: show selected variant price */
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs md:text-sm font-bold text-[#BC8242] tracking-wider">
                Rs{activeVariant.price.toLocaleString()}.00
              </span>
              {activeVariant.regularPrice && (
                <span className="text-[10px] text-stone-400 line-through">
                  Rs{activeVariant.regularPrice.toLocaleString()}.00
                </span>
              )}
              <span className="text-[9px] font-bold text-stone-700 bg-stone-100 border border-stone-200 px-1 py-0.2 rounded-xs uppercase">
                {activeVariant.size}
              </span>
            </div>
          ) : (
            /* Default: show guaranteed clean range (e.g. "Rs400 – Rs1,600") */
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-stone-800 tracking-wider">
                {rangeDisplay}
              </span>
              {(product.original_price || product.originalPrice) && (
                <span className="text-[10px] text-stone-400 line-through">
                  {product.original_price || product.originalPrice}
                </span>
              )}
            </div>
          )}

          {isProductOutOfStock && (
            <span className="text-[9px] uppercase font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-xs shrink-0">
              Sold Out
            </span>
          )}
        </div>

        {/* Mobile Dedicated Touch Actions */}
        <div className="mt-2 sm:hidden flex items-center gap-1.5">
          <button
            onClick={hasUserSelectedVariant ? handleQuickAdd : navigateToProduct}
            className="flex-1 py-1.5 px-2 bg-stone-900 text-white active:bg-[#BC8242] text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
          >
            <ShoppingBag size={11} />
            <span>{hasUserSelectedVariant ? `Add ${activeVariant.size}` : "View Product"}</span>
          </button>
          <button
            onClick={navigateToProduct}
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
