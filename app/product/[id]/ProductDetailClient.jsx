"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/SectionHeader";
import { useCart } from "@/context/CartContext";
import {
  Star,
  ShoppingBag,
  Check,
  ShieldCheck,
  Clock,
  Sparkles,
  ZoomIn,
  X,
  ChevronRight,
} from "lucide-react";

export default function ProductDetailClient({ product, relatedProducts = [] }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState(product?.variants?.[0]?.size || "3ml");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product?.image || "");
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Sync state if product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.variants?.[0]?.size || "3ml");
      setQuantity(1);
      setActiveImage(product.image || "");
      setIsLightboxOpen(false);
    }
  }, [product]);

  // Handle ESC key for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  if (!product) return null;

  const displayImage = activeImage || product.image;
  const activeVariant =
    product.variants.find((v) => v.size === selectedSize) || product.variants[0];

  const handleAddToCart = () => {
    addToCart({
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
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-[#f3dfc6] selection:text-[#744512]">
      {/* Main Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb Bar */}
        <div className="bg-[#faf9f6] border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
            <nav className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
              <Link href="/" className="hover:text-[#BC8242] transition-colors">
                Home
              </Link>
              <ChevronRight size={12} className="text-stone-400 shrink-0" />
              <Link href="/shop" className="hover:text-[#BC8242] transition-colors">
                Shop
              </Link>
              <ChevronRight size={12} className="text-stone-400 shrink-0" />
              <span className="text-stone-400 capitalize">{product.categoryDisplay}</span>
              <ChevronRight size={12} className="text-stone-400 shrink-0" />
              <span className="font-semibold text-stone-800 uppercase truncate">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Product Details Section - Exact Details from Modal */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
            {/* Left: Product Images Gallery - Big, bold presentation without wide padded background */}
            <div className="space-y-3 sm:space-y-4">
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="relative aspect-square w-full rounded-xs border border-stone-200 overflow-hidden group/zoom shadow-sm bg-white cursor-zoom-in"
                title="Click to expand full image"
              >
                {/* Sale Badge */}
                {product.saleBadge && (
                  <span className="absolute top-3.5 left-3.5 z-10 px-2.5 py-1 text-[11px] uppercase font-bold tracking-wider bg-[#BC8242] text-white rounded-xs shadow-md">
                    {product.saleBadge}
                  </span>
                )}

                {/* Big Full-bleed Product Image */}
                {displayImage && (
                  <Image
                    src={displayImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover/zoom:scale-105"
                    priority
                  />
                )}

                {/* Hover Zoom Pill */}
                <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-stone-800 text-xs font-semibold flex items-center gap-1.5 shadow-md border border-stone-200/80 backdrop-blur-xs transition-all opacity-90 group-hover/zoom:opacity-100">
                  <ZoomIn size={14} className="text-[#BC8242]" />
                  <span>Click to expand</span>
                </div>
              </div>

              {/* Thumbnails switcher (if secondary image exists) */}
              {product.secondaryImage && (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => setActiveImage(product.image)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xs border-2 overflow-hidden bg-white transition-all cursor-pointer ${
                      displayImage === product.image
                        ? "border-[#BC8242] ring-2 ring-[#BC8242]/40 scale-102 shadow-xs"
                        : "border-stone-300 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={product.image}
                      alt={`${product.name} primary`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                  <button
                    onClick={() => setActiveImage(product.secondaryImage)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xs border-2 overflow-hidden bg-white transition-all cursor-pointer ${
                      displayImage === product.secondaryImage
                        ? "border-[#BC8242] ring-2 ring-[#BC8242]/40 scale-102 shadow-xs"
                        : "border-stone-300 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={product.secondaryImage}
                      alt={`${product.name} secondary`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Product Details & Options */}
            <div className="flex flex-col space-y-5 lg:pl-2">
              {/* Category kicker */}
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#BC8242] font-bold block mb-1">
                  {product.categoryDisplay}
                </span>

                {/* Product Title in Outfit */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-luxury font-bold text-stone-900 uppercase tracking-wide">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-stone-600 font-medium">
                    {product.rating} ({product.reviewsCount} verified reviews)
                  </span>
                </div>

                {/* Optional Inspiration Note */}
                {product.inspiredBy && (
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#925c24] bg-[#fbf7f0] border border-[#BC8242]/30 px-3 py-1.5 rounded-xs mt-3 shadow-xs">
                    <Sparkles size={13} className="text-[#BC8242] shrink-0" />
                    <span>{product.inspiredBy}</span>
                  </div>
                )}
              </div>

              {/* Price display based on variant */}
              <div className="flex items-baseline gap-3 py-1 border-b border-stone-200">
                <span className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#BC8242]">
                  Rs{activeVariant.price.toLocaleString()}.00
                </span>
                {activeVariant.regularPrice && (
                  <span className="text-sm sm:text-base text-stone-400 line-through">
                    Rs{activeVariant.regularPrice.toLocaleString()}.00
                  </span>
                )}
                {activeVariant.regularPrice && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs">
                    Save Rs{(activeVariant.regularPrice - activeVariant.price).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-stone-600 leading-relaxed">
                {product.description}
              </p>

              {/* Fragrance Notes / Pyramid */}
              {product.pyramid && (
                <div className="p-3.5 sm:p-4 bg-stone-50 rounded-xs border border-stone-200/90 space-y-2 text-xs sm:text-sm">
                  <div className="font-bold text-stone-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#BC8242]">
                    <Sparkles size={14} /> Olfactory Notes
                  </div>
                  <div className="text-stone-700">
                    <strong className="text-stone-900">Top:</strong> {product.pyramid.top}
                  </div>
                  <div className="text-stone-700">
                    <strong className="text-stone-900">Heart:</strong> {product.pyramid.heart}
                  </div>
                  <div className="text-stone-700">
                    <strong className="text-stone-900">Base:</strong> {product.pyramid.base}
                  </div>
                </div>
              )}

              {/* Variant Selector */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
                  Select Bottle Size / Presentation:
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.size}
                      onClick={() => setSelectedSize(v.size)}
                      className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xs border transition-all cursor-pointer ${
                        selectedSize === v.size
                          ? "bg-stone-900 border-stone-900 text-white shadow-xs scale-102"
                          : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                      }`}
                    >
                      {v.size} — Rs{v.price.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper & Add to Cart */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between sm:justify-center border border-stone-300 rounded-xs bg-white px-2 py-1 shrink-0 h-12">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors text-base font-bold cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-bold text-stone-800 min-w-[32px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1 text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors text-base font-bold cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Add To Cart CTA */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addedSuccess}
                    className={`flex-1 py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      addedSuccess
                        ? "bg-emerald-600 text-white"
                        : "bg-[#BC8242] hover:bg-[#a66f33] active:bg-[#925c27] text-white hover:shadow-lg"
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check size={18} /> Added To Your Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={17} /> Add To Cart — Rs{(activeVariant.price * quantity).toLocaleString()}
                      </>
                    )}
                  </button>
                </div>

                {/* Trust Guarantees */}
                <div className="flex items-center justify-center sm:justify-start gap-5 text-xs text-stone-600 pt-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    100% Pure Non-Alcoholic Attar
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={16} className="text-emerald-600 shrink-0" />
                    24h Longevity Guarantee
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED PRODUCTS SECTION - Exact match requirement ("except under related products option") */}
        {relatedProducts.length > 0 && (
          <section className="bg-stone-50/70 border-t border-stone-200 py-12 sm:py-16 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title="RELATED FRAGRANCES"
                subtitle="Complementary Artisanal Attars"
              />

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-6">
                {relatedProducts.map((relProduct) => (
                  <ProductCard
                    key={relProduct.id}
                    product={relProduct}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

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
            {displayImage && (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 95vw, 1200px"
                className="object-contain drop-shadow-2xl"
                priority
              />
            )}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
