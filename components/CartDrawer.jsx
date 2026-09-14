"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Truck,
  Check,
  CheckCircle2,
  ShieldCheck,
  Banknote,
  Copy,
  Printer,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Package,
} from "lucide-react";
import { SITE_CONFIG } from "@/data/storeData";
import {
  VALID_PROMOS,
  POPULAR_CITIES,
  generateOrderId,
  saveOrderToStorage,
} from "@/utils/orderStorage";

export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) {
  // Step navigation: "cart" | "checkout" | "success"
  const [currentStep, setCurrentStep] = useState("cart");

  // Promo code state
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Customer checkout form state
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    notes: "",
  });

  // Validation errors
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placed order receipt data
  const [placedOrder, setPlacedOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const freeShipping = subtotal >= SITE_CONFIG.freeShippingThreshold;
  const shippingFee = items.length === 0 ? 0 : freeShipping ? 0 : 250;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  const progressPercent = Math.min(100, (subtotal / SITE_CONFIG.freeShippingThreshold) * 100);
  const remainingForFree = Math.max(0, SITE_CONFIG.freeShippingThreshold - subtotal);

  // Apply Promo Code
  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (VALID_PROMOS[code]) {
      setDiscountPercent(VALID_PROMOS[code].percent);
      setCouponSuccess(VALID_PROMOS[code].label);
      setCouponError("");
    } else {
      setCouponError("Invalid code. Try 'UTOOR10' or 'AZAMI15'");
      setCouponSuccess("");
    }
  };

  // Quick Select City
  const handleSelectCity = (city) => {
    setCustomerInfo((prev) => ({ ...prev, city }));
    if (formErrors.city) {
      setFormErrors((prev) => ({ ...prev, city: null }));
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!customerInfo.name.trim() || customerInfo.name.trim().length < 2) {
      errors.name = "Please enter your full name";
    }

    const cleanPhone = customerInfo.phone.replace(/[\s-]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Please enter a valid phone number (e.g. 0300 1234567)";
    }

    if (!customerInfo.city.trim()) {
      errors.city = "Please select or enter your city";
    }

    if (!customerInfo.address.trim() || customerInfo.address.trim().length < 6) {
      errors.address = "Please enter your complete delivery address (House/Street/Area)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Place Order (Cash on Delivery)
  const handlePlaceOrder = () => {
    if (!validateForm()) return;
    if (items.length === 0) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const orderId = generateOrderId();
      const orderData = {
        orderId,
        createdAt: new Date().toISOString(),
        formattedDate: new Date().toLocaleDateString("en-PK", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        customer: {
          name: customerInfo.name.trim(),
          phone: customerInfo.phone.trim(),
          email: customerInfo.email.trim(),
          city: customerInfo.city.trim(),
          address: customerInfo.address.trim(),
          notes: customerInfo.notes.trim(),
        },
        items: [...items],
        paymentMethod: "Cash on Delivery (COD)",
        subtotal,
        discountAmount,
        discountPercent,
        shippingFee,
        grandTotal,
        status: "Confirmed",
      };

      // Save to localStorage
      saveOrderToStorage(orderData);

      // Update state & clear cart
      setPlacedOrder(orderData);
      setIsSubmitting(false);
      setCurrentStep("success");
      if (onClearCart) onClearCart();
    }, 700);
  };

  // Reset and Close
  const handleContinueShopping = () => {
    setCurrentStep("cart");
    setPlacedOrder(null);
    setFormErrors({});
    onClose();
  };

  // Copy Order ID
  const handleCopyOrderId = () => {
    if (placedOrder) {
      navigator.clipboard.writeText(placedOrder.orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={currentStep === "success" ? handleContinueShopping : onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-lg bg-white shadow-2xl flex flex-col justify-between animate-slideInRight">
          
          {/* Top Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
            <div className="flex items-center gap-2.5">
              {currentStep === "cart" && (
                <>
                  <ShoppingBag size={20} className="text-[#BC8242]" />
                  <h2 className="font-serif-luxury text-base sm:text-lg font-bold uppercase tracking-wider text-stone-900">
                    Shopping Bag ({items.reduce((a, b) => a + b.quantity, 0)})
                  </h2>
                </>
              )}

              {currentStep === "checkout" && (
                <>
                  <button
                    onClick={() => setCurrentStep("cart")}
                    className="p-1 -ml-1 text-stone-500 hover:text-stone-900 transition-colors"
                    aria-label="Back to cart"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="font-serif-luxury text-base sm:text-lg font-bold uppercase tracking-wider text-stone-900">
                    Checkout (Cash on Delivery)
                  </h2>
                </>
              )}

              {currentStep === "success" && (
                <>
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <h2 className="font-serif-luxury text-base sm:text-lg font-bold uppercase tracking-wider text-emerald-800">
                    Order Confirmed
                  </h2>
                </>
              )}
            </div>

            <button
              onClick={currentStep === "success" ? handleContinueShopping : onClose}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-200 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="bg-stone-100/70 px-4 py-2 border-b border-stone-200 text-[11px] font-medium flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-1 ${
                  currentStep === "cart" ? "text-[#BC8242] font-bold" : "text-stone-500"
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === "cart" ? "bg-[#BC8242] text-white" : "bg-stone-300 text-stone-700"
                }`}>1</span>
                Cart
              </span>

              <span className="text-stone-300">/</span>

              <span
                className={`flex items-center gap-1 ${
                  currentStep === "checkout" ? "text-[#BC8242] font-bold" : "text-stone-500"
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === "checkout" ? "bg-[#BC8242] text-white" : "bg-stone-300 text-stone-700"
                }`}>2</span>
                Delivery & COD
              </span>

              <span className="text-stone-300">/</span>

              <span
                className={`flex items-center gap-1 ${
                  currentStep === "success" ? "text-emerald-700 font-bold" : "text-stone-400"
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === "success" ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-400"
                }`}>3</span>
                Confirmation
              </span>
            </div>

            {currentStep === "cart" && items.length > 0 && (
              <Link
                href="/checkout"
                onClick={onClose}
                className="text-[#BC8242] hover:underline flex items-center gap-1 text-[11px] font-semibold"
              >
                Full Page <ExternalLink size={11} />
              </Link>
            )}
          </div>

          {/* Free Shipping Meter (Only on Cart / Checkout) */}
          {currentStep !== "success" && items.length > 0 && (
            <div className="bg-[#f7f2ea] px-4 sm:px-6 py-2.5 border-b border-[#e9decb]">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-1.5">
                <span className="flex items-center gap-1.5 text-[#915e27]">
                  <Truck size={14} />
                  {freeShipping ? (
                    <span className="text-emerald-700 font-bold">You unlocked FREE Nationwide Delivery!</span>
                  ) : (
                    <span>
                      Add <strong className="text-stone-900">Rs{remainingForFree.toLocaleString()}</strong> more for FREE Shipping
                    </span>
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
          )}

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            
            {/* ---------------------------------------------------- */}
            {/* STEP 1: CART VIEW */}
            {/* ---------------------------------------------------- */}
            {currentStep === "cart" && (
              <>
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                      <ShoppingBag size={30} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif-luxury text-lg font-semibold text-stone-800">
                        Your shopping bag is empty
                      </h3>
                      <p className="text-xs text-stone-500 max-w-xs">
                        Discover our pure non-alcoholic concentrated perfume oils and artisanal attars.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-full bg-[#BC8242] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#a66f33] transition-colors"
                    >
                      Explore Fragrances
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Items List */}
                    <div className="space-y-3.5 divide-y divide-stone-100">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3.5 pt-3.5 first:pt-0 items-center">
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
                              {/* Quantity Stepper */}
                              <div className="flex items-center border border-stone-200 rounded-xs bg-stone-50">
                                <button
                                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                  className="p-1 hover:bg-stone-200 text-stone-600 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="px-2.5 text-xs font-bold text-stone-800">
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
                    </div>

                    {/* Promo Code Input */}
                    <div className="pt-4 border-t border-stone-200">
                      <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                        Promo / Discount Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. UTOOR10 or AZAMI15"
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

                    {/* Trust banner */}
                    <div className="p-3 bg-stone-50 rounded-xs border border-stone-200/80 text-[11px] text-stone-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                        <Banknote size={14} className="text-[#BC8242]" />
                        <span>Cash on Delivery (COD) Only</span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-normal">
                        No bank transfer or card needed. Pay cash safely at your doorstep upon receiving your parcel.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 2: CHECKOUT & DELIVERY FORM (COD ONLY) */}
            {/* ---------------------------------------------------- */}
            {currentStep === "checkout" && (
              <div className="space-y-4">
                <div className="border-b border-stone-200 pb-2">
                  <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                    Shipping & Delivery Details
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Please provide your delivery information for courier dispatch.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Bilal"
                      value={customerInfo.name}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                      }}
                      className={`w-full px-3 py-2 text-xs border rounded-xs focus:outline-none ${
                        formErrors.name ? "border-red-500 bg-red-50/20" : "border-stone-300 focus:border-[#BC8242]"
                      }`}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-[10px] text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Mobile / WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0300 1234567"
                    value={customerInfo.phone}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                    }}
                    className={`w-full px-3 py-2 text-xs border rounded-xs focus:outline-none ${
                      formErrors.phone ? "border-red-500 bg-red-50/20" : "border-stone-300 focus:border-[#BC8242]"
                    }`}
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Rider will call this number prior to parcel delivery.
                  </p>
                  {formErrors.phone && (
                    <p className="text-[10px] text-red-500 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Email Address <span className="text-stone-400 font-normal">(Optional, for receipt)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xs focus:outline-none focus:border-[#BC8242]"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    value={customerInfo.city}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, city: e.target.value });
                      if (formErrors.city) setFormErrors({ ...formErrors, city: null });
                    }}
                    className={`w-full px-3 py-2 text-xs border rounded-xs focus:outline-none mb-1.5 ${
                      formErrors.city ? "border-red-500 bg-red-50/20" : "border-stone-300 focus:border-[#BC8242]"
                    }`}
                  />
                  
                  {/* Quick City Selector Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CITIES.slice(0, 7).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleSelectCity(c)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          customerInfo.city.toLowerCase() === c.toLowerCase()
                            ? "bg-[#BC8242] text-white border-[#BC8242]"
                            : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {formErrors.city && (
                    <p className="text-[10px] text-red-500 mt-1">{formErrors.city}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Complete Street Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="House / Flat #, Street #, Sector / Area, Landmark..."
                    value={customerInfo.address}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, address: e.target.value });
                      if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                    }}
                    className={`w-full px-3 py-2 text-xs border rounded-xs focus:outline-none ${
                      formErrors.address ? "border-red-500 bg-red-50/20" : "border-stone-300 focus:border-[#BC8242]"
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-[10px] text-red-500 mt-1">{formErrors.address}</p>
                  )}
                </div>

                {/* Order Notes (Optional) */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Special Delivery Instructions <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call before arrival, leave with gatekeeper"
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xs focus:outline-none focus:border-[#BC8242]"
                  />
                </div>

                {/* PAYMENT METHOD: STRICTLY COD */}
                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block mb-2">
                    Payment Method
                  </label>

                  <div className="p-3.5 bg-amber-50/70 rounded-xs border-2 border-[#BC8242] relative">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#BC8242] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <Banknote size={15} className="text-[#BC8242]" />
                            Cash on Delivery (COD)
                          </span>
                          <span className="text-[10px] bg-[#BC8242]/15 text-[#915e27] font-bold px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                          Pay in cash directly to the courier delivery agent when your parcel arrives.
                        </p>
                        <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>100% Risk-Free • No Bank Transfer or Advance Needed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Summary list in Checkout */}
                <div className="p-3 bg-stone-50 rounded-xs border border-stone-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                    Order Items ({items.length})
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-stone-600 divide-y divide-stone-100">
                    {items.map((it) => (
                      <div key={it.id} className="pt-1 first:pt-0 flex justify-between">
                        <span className="truncate pr-2">
                          {it.name} ({it.size}) × {it.quantity}
                        </span>
                        <span className="font-semibold text-stone-800 shrink-0">
                          Rs{(it.price * it.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 3: ORDER CONFIRMATION / SUCCESS SCREEN */}
            {/* ---------------------------------------------------- */}
            {currentStep === "success" && placedOrder && (
              <div className="space-y-5 py-2">
                {/* Header Icon */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mx-auto shadow-sm animate-bounce">
                    <Check size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-stone-600 max-w-xs mx-auto">
                    Thank you, <strong className="text-stone-900">{placedOrder.customer.name}</strong>. Your artisanal fragrances are being prepared for dispatch.
                  </p>
                </div>

                {/* Order ID & Date Card */}
                <div className="p-3.5 bg-stone-50 rounded-xs border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 block font-semibold">
                      Order Reference
                    </span>
                    <span className="font-mono text-sm font-bold text-stone-900 tracking-wider">
                      #{placedOrder.orderId}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyOrderId}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xs border border-stone-300 hover:bg-white text-stone-700 transition-colors"
                  >
                    {copiedId ? (
                      <>
                        <Check size={12} className="text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Delivery & Payment Badges */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-3 bg-amber-50/50 rounded-xs border border-amber-200/80">
                    <span className="text-[10px] uppercase font-bold text-[#915e27] tracking-wider block">
                      Payment Mode
                    </span>
                    <span className="text-xs font-bold text-stone-900 mt-0.5 block">
                      Cash on Delivery
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      Rs{placedOrder.grandTotal.toLocaleString()} on arrival
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xs border border-emerald-200/80">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Est. Delivery
                    </span>
                    <span className="text-xs font-bold text-stone-900 mt-0.5 block">
                      2 to 4 Business Days
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      Express Courier Dispatch
                    </span>
                  </div>
                </div>

                {/* Shipping Destination */}
                <div className="p-3.5 bg-white rounded-xs border border-stone-200 space-y-1.5 text-xs text-stone-700">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900 pb-1 border-b border-stone-100">
                    <MapPin size={14} className="text-[#BC8242]" />
                    <span>Shipping Destination</span>
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold text-stone-900">{placedOrder.customer.name}</p>
                    <p className="text-stone-600">{placedOrder.customer.phone}</p>
                    <p className="text-stone-600 leading-relaxed mt-0.5">
                      {placedOrder.customer.address}, <strong className="text-stone-800">{placedOrder.customer.city}</strong>
                    </p>
                    {placedOrder.customer.notes && (
                      <p className="text-[11px] text-stone-500 italic mt-1">
                        Note: &ldquo;{placedOrder.customer.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Summary Table */}
                <div className="p-3.5 bg-white rounded-xs border border-stone-200 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-900 block pb-1 border-b border-stone-100">
                    Purchased Fragrances
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto divide-y divide-stone-100">
                    {placedOrder.items.map((it) => (
                      <div key={it.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-stone-900 truncate">{it.name}</p>
                          <p className="text-[11px] text-stone-500">{it.size} × {it.quantity}</p>
                        </div>
                        <span className="font-bold text-stone-900 shrink-0">
                          Rs{(it.price * it.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals in receipt */}
                  <div className="pt-2 border-t border-stone-200 text-xs space-y-1">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal</span>
                      <span>Rs{placedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    {placedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount ({placedOrder.discountPercent}%)</span>
                        <span>-Rs{placedOrder.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-600">
                      <span>Delivery Fee</span>
                      <span>
                        {placedOrder.shippingFee === 0 ? "FREE" : `Rs${placedOrder.shippingFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-stone-900 pt-1.5 border-t border-stone-100">
                      <span>Total (Pay on Delivery)</span>
                      <span className="text-[#BC8242] font-serif-luxury text-base">
                        Rs{placedOrder.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reminder note */}
                <div className="p-3 bg-amber-50/60 rounded-xs border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <p className="leading-normal">
                    Please keep <strong>Rs{placedOrder.grandTotal.toLocaleString()} cash</strong> ready when the courier rider arrives.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------- */}
          {/* BOTTOM FOOTER / ACTION BUTTONS */}
          {/* ---------------------------------------------------- */}
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3">
            
            {/* Step 1 Footer: Price Summary + Proceed to Checkout */}
            {currentStep === "cart" && items.length > 0 && (
              <>
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
                    <span>Total (COD)</span>
                    <span className="text-[#BC8242] font-serif-luxury text-lg">
                      Rs{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setCurrentStep("checkout")}
                    className="w-full py-3.5 rounded-full bg-stone-900 hover:bg-[#BC8242] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    Proceed To Checkout (COD) <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {/* Step 2 Footer: Place Order (Cash on Delivery) */}
            {currentStep === "checkout" && (
              <>
                <div className="flex justify-between items-center text-sm font-bold text-stone-900 pb-1">
                  <div>
                    <span className="text-xs text-stone-500 font-normal block">Total to pay on delivery</span>
                    <span className="text-base text-[#BC8242] font-serif-luxury">
                      Rs{grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-xs border border-emerald-200 font-semibold flex items-center gap-1">
                    <Check size={12} /> Cash on Delivery
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-full bg-[#BC8242] hover:bg-[#a66f33] active:bg-[#925c27] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-75 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Placing Your COD Order...
                      </span>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        Confirm & Place Order (Rs{grandTotal.toLocaleString()})
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep("cart")}
                    className="w-full py-2 text-stone-500 hover:text-stone-800 text-xs font-medium text-center transition-colors"
                  >
                    ← Modify Cart Items
                  </button>
                </div>
              </>
            )}

            {/* Step 3 Footer: Print & Continue Shopping */}
            {currentStep === "success" && (
              <div className="space-y-2">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-full border border-stone-300 hover:bg-white text-stone-700 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer size={14} /> Print / Save Order Receipt
                </button>

                <button
                  onClick={handleContinueShopping}
                  className="w-full py-3 rounded-full bg-[#BC8242] hover:bg-[#a66f33] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  Continue Exploring Attars <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
