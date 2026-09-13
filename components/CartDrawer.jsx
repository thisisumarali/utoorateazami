"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Check } from "lucide-react";
import { SITE_CONFIG } from "@/data/storeData";

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) {
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
  });

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const freeShipping = subtotal >= SITE_CONFIG.freeShippingThreshold;
  const shippingFee = items.length === 0 ? 0 : freeShipping ? 0 : 250;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  const progressPercent = Math.min(100, (subtotal / SITE_CONFIG.freeShippingThreshold) * 100);
  const remainingForFree = Math.max(0, SITE_CONFIG.freeShippingThreshold - subtotal);

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "UTOOR10" || couponCode.trim().toUpperCase() === "WELCOME10") {
      setDiscountPercent(10);
      setCouponSuccess("10% Special Discount Applied!");
      setCouponError("");
    } else {
      setCouponError("Invalid promo code. Try 'UTOOR10'");
      setCouponSuccess("");
    }
  };

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;
    const itemList = items
      .map((item, idx) => `${idx + 1}. ${item.name} (${item.size}) x${item.quantity} - Rs${(item.price * item.quantity).toLocaleString()}`)
      .join("\n");
    const addressDetails = customerInfo.name ? `\n\n*Customer Details:*\nName: ${customerInfo.name}\nPhone: ${customerInfo.phone}\nCity: ${customerInfo.city}\nAddress: ${customerInfo.address}` : "";
    const msg = `*NEW ORDER - UTOOR ATEAZAMI*\n-------------------------\n${itemList}\n-------------------------\n*Subtotal:* Rs${subtotal.toLocaleString()}\n*Shipping:* ${freeShipping ? "FREE" : "Rs250"}\n*Total:* Rs${grandTotal.toLocaleString()}${addressDetails}\n\nPlease confirm availability and payment options!`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encoded}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-slideInRight">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#BC8242]" />
              <h2 className="font-serif-luxury text-lg font-bold uppercase tracking-wider text-stone-900">
                Shopping Cart ({items.reduce((a, b) => a + b.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-200 transition-colors"
              aria-label="Close Cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          <div className="bg-[#f7f2ea] px-6 py-3 border-b border-[#e9decb]">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-1.5">
              <span className="flex items-center gap-1.5 text-[#915e27]">
                <Truck size={15} />
                {freeShipping ? (
                  <span className="text-emerald-700 font-bold">You unlocked FREE Nationwide Delivery!</span>
                ) : (
                  <span>Add <strong className="text-stone-900">Rs{remainingForFree.toLocaleString()}</strong> more for FREE Shipping</span>
                )}
              </span>
              <span className="text-[11px] text-stone-500">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  freeShipping ? "bg-emerald-600" : "bg-[#BC8242]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Body: Items or Empty state */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <ShoppingBag size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif-luxury text-lg font-semibold text-stone-800">
                    Your cart is empty
                  </h3>
                  <p className="text-xs text-stone-500 max-w-xs">
                    Explore our pure non-alcoholic attars and luxury ouds to begin your olfactory journey.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#BC8242] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#a66f33] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : !checkoutStep ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3.5 pb-4 border-b border-stone-100 items-center"
                  >
                    <div className="relative w-16 h-16 bg-[#f7f6f2] rounded-xs overflow-hidden border border-stone-200 shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-1.5"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif-luxury text-sm font-semibold text-stone-900 truncate">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-stone-400 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <span className="text-[11px] text-stone-500 block">
                        Size: <strong className="text-stone-700">{item.size}</strong>
                      </span>

                      <div className="flex justify-between items-center mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-stone-200 rounded-xs bg-stone-50">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-stone-200 text-stone-600 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-xs font-bold text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-stone-200 text-stone-600 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-stone-900">
                          Rs{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Coupon Code Section */}
                <div className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon (e.g. UTOOR10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xs focus:outline-none focus:border-[#BC8242] uppercase tracking-wider"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-stone-800 text-white text-xs font-semibold rounded-xs hover:bg-stone-900 transition-colors uppercase tracking-wider"
                    >
                      Apply
                    </button>
                  </div>
                  {couponSuccess && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      ✓ {couponSuccess}
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      ✕ {couponError}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Quick Checkout Form */
              <div className="space-y-3.5">
                <button
                  onClick={() => setCheckoutStep(false)}
                  className="text-xs font-semibold text-[#BC8242] hover:underline mb-2 block"
                >
                  ← Back to cart items
                </button>
                <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                  Delivery Details
                </h3>
                <div>
                  <label className="text-xs text-stone-600 font-medium block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed Ali"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xs focus:outline-none focus:border-[#BC8242]"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 font-medium block mb-1">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0300 1234567"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xs focus:outline-none focus:border-[#BC8242]"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 font-medium block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xs focus:outline-none focus:border-[#BC8242]"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 font-medium block mb-1">Complete Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="House/Plot #, Street, Area..."
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xs focus:outline-none focus:border-[#BC8242]"
                  />
                </div>
                <div className="p-3 bg-amber-50 rounded-xs border border-amber-200/80 text-[11px] text-amber-900">
                  💵 <strong>Cash on Delivery (COD)</strong> available across Pakistan. Payment upon arrival.
                </div>
              </div>
            )}
          </div>

          {/* Footer: Order Summary & Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-800">Rs{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Discount ({discountPercent}%)</span>
                    <span>-Rs{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-stone-800">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `Rs${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total</span>
                  <span className="text-[#BC8242] font-serif-luxury text-lg">
                    Rs{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {!checkoutStep ? (
                  <button
                    onClick={() => setCheckoutStep(true)}
                    className="w-full py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    Proceed To Checkout <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleWhatsAppOrder}
                    className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    Confirm & Complete via WhatsApp <ArrowRight size={14} />
                  </button>
                )}

                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-2.5 rounded-full border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  Instant Order via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
