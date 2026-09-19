"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Check,
  CheckCircle2,
  Banknote,
  Copy,
  Printer,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Lock,
} from "lucide-react";
import { SITE_CONFIG } from "@/data/storeData";
import {
  VALID_PROMOS,
  POPULAR_CITIES,
  generateOrderId,
  saveOrderToStorage,
} from "@/utils/orderStorage";

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form State
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponError, setCouponError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("utoorateazami_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        // Fallback demo item if cart empty
        setItems([
          {
            id: "silver-oud-3ml",
            productId: "silver-oud",
            name: "SILVER OUD",
            image: "https://utoorateazami.com/wp-content/uploads/2024/09/74-1024x1024.png",
            size: "3ml",
            price: 500,
            quantity: 1,
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoaded(true);
  }, []);

  // Price calculations
  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const freeShipping = subtotal >= SITE_CONFIG.freeShippingThreshold;
  const shippingFee = items.length === 0 ? 0 : freeShipping ? 0 : 250;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Apply Coupon
  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (VALID_PROMOS[code]) {
      setDiscountPercent(VALID_PROMOS[code].percent);
      setCouponSuccess(VALID_PROMOS[code].label);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code. Try 'UTOOR10' or 'AZAMI15'");
      setCouponSuccess("");
    }
  };

  // Select City Pill
  const handleSelectCity = (c) => {
    setCustomerInfo((prev) => ({ ...prev, city: c }));
    if (formErrors.city) setFormErrors((prev) => ({ ...prev, city: null }));
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!customerInfo.name.trim() || customerInfo.name.trim().length < 2) {
      errors.name = "Please enter your full name";
    }

    const cleanPhone = customerInfo.phone.replace(/[\s-]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Please enter a valid mobile number (e.g. 0300 1234567)";
    }

    if (!customerInfo.city.trim()) {
      errors.city = "Please select or specify your city";
    }

    if (!customerInfo.address.trim() || customerInfo.address.trim().length < 6) {
      errors.address = "Please enter complete street and house delivery address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Place COD Order
  const handlePlaceOrder = (e) => {
    if (e) e.preventDefault();
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
      localStorage.removeItem("utoorateazami_cart");

      setPlacedOrder(orderData);
      setItems([]);
      setIsSubmitting(false);
    }, 700);
  };

  const handleCopyOrderId = () => {
    if (placedOrder) {
      navigator.clipboard.writeText(placedOrder.orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="w-8 h-8 border-2 border-[#BC8242] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ----------------------------------------------------
  // ORDER SUCCESS CONFIRMATION VIEW
  // ----------------------------------------------------
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-[#fbf9f5] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-stone-200 p-6 sm:p-10 space-y-8">
          
          {/* Top Checkmark Header */}
          <div className="text-center space-y-3">
            <div className="w-18 h-18 rounded-full bg-emerald-100/90 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
              <Check size={36} strokeWidth={2.5} />
            </div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900">
              Order Placed Successfully!
            </h1>
            <p className="text-stone-600 text-sm max-w-md mx-auto">
              Thank you, <strong className="text-stone-900">{placedOrder.customer.name}</strong>. Your artisanal concentrated perfume oils are being hand-packaged.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-4 bg-stone-50 rounded-md border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-stone-500 block">
                Order Tracking ID
              </span>
              <span className="font-mono text-lg font-bold text-stone-900 tracking-wider">
                #{placedOrder.orderId}
              </span>
            </div>
            <button
              onClick={handleCopyOrderId}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-sm border border-stone-300 hover:bg-white text-stone-700 transition-colors"
            >
              {copiedId ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* Two status blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50/60 rounded-md border border-amber-200/80">
              <span className="text-xs font-bold text-[#915e27] uppercase tracking-wider block">
                Payment Mode
              </span>
              <span className="text-sm font-bold text-stone-900 mt-1 block">
                Cash on Delivery (COD)
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                Pay <strong>Rs{placedOrder.grandTotal.toLocaleString()}</strong> in cash upon delivery.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-md border border-emerald-200/80">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <span className="text-sm font-bold text-stone-900 mt-1 block">
                2 to 4 Business Days
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                Dispatched via TCS / Leopards / Trax Express.
              </p>
            </div>
          </div>

          {/* Destination */}
          <div className="p-4 bg-white rounded-md border border-stone-200 space-y-2 text-sm text-stone-700">
            <div className="flex items-center gap-2 font-bold text-stone-900 pb-2 border-b border-stone-100">
              <MapPin size={16} className="text-[#BC8242]" />
              <span>Delivery Address</span>
            </div>
            <div>
              <p className="font-semibold text-stone-900">{placedOrder.customer.name}</p>
              <p className="text-stone-600">{placedOrder.customer.phone}</p>
              <p className="text-stone-600 leading-relaxed mt-1">
                {placedOrder.customer.address}, <strong className="text-stone-800">{placedOrder.customer.city}</strong>
              </p>
              {placedOrder.customer.notes && (
                <p className="text-xs text-stone-500 italic mt-1.5">
                  Delivery instructions: &ldquo;{placedOrder.customer.notes}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Items Recap */}
          <div className="p-4 bg-stone-50/70 rounded-md border border-stone-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-900 block pb-2 border-b border-stone-200">
              Purchased Items
            </span>
            <div className="divide-y divide-stone-200/80">
              {placedOrder.items.map((it) => (
                <div key={it.id} className="py-2.5 first:pt-0 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-stone-900">{it.name}</p>
                    <p className="text-xs text-stone-500">Size: {it.size} × {it.quantity}</p>
                  </div>
                  <span className="font-bold text-stone-900">
                    Rs{(it.price * it.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 text-sm space-y-1.5">
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
                <span>{placedOrder.shippingFee === 0 ? "FREE" : `Rs${placedOrder.shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Amount to Pay</span>
                <span className="text-[#BC8242] font-serif-luxury text-lg">
                  Rs{placedOrder.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-full border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Printer size={15} /> Print Receipt
            </button>

            <Link
              href="/"
              className="flex-1 py-3 rounded-full bg-[#BC8242] hover:bg-[#a66f33] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md text-center"
            >
              Continue Exploring Attars <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // EMPTY CART CHECK
  // ----------------------------------------------------
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center px-4 py-16 text-center space-y-4">
        <div className="w-18 h-18 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
          <ShoppingBag size={34} />
        </div>
        <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-stone-500 text-sm max-w-sm">
          Select from our range of pure non-alcoholic attars and luxury ouds to place an order.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-[#BC8242] hover:bg-[#a66f33] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md"
        >
          Browse Fragrances
        </Link>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN CHECKOUT FORM (COD ONLY)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 flex flex-col">
      {/* Checkout Navbar */}
      <header className="w-full bg-white border-b border-stone-200 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
              <Image
                src={SITE_CONFIG.logoUrl}
                alt={SITE_CONFIG.name}
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-luxury text-base sm:text-lg font-bold tracking-wider text-stone-900 group-hover:text-[#BC8242] transition-colors uppercase">
                UTOORAT E AZAMI
              </span>
              <span className="text-[9px] tracking-[0.2em] text-[#BC8242] uppercase font-semibold leading-none">
                {SITE_CONFIG.arabicName}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-stone-600 font-medium">
              <Lock size={14} className="text-emerald-600" />
              100% Safe Cash on Delivery
            </span>
            <Link
              href="/"
              className="text-xs font-semibold text-[#BC8242] hover:underline flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Back to Store
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Delivery Details & Payment */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-stone-200 shadow-xs space-y-6">
              <div>
                <h1 className="font-serif-luxury text-xl sm:text-2xl font-bold text-stone-900">
                  Shipping Details
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  Deliveries are dispatched via reliable express couriers across Pakistan.
                </p>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Mehmood"
                    value={customerInfo.name}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-sm focus:outline-none ${
                      formErrors.name ? "border-red-500 bg-red-50/20" : "border-stone-300 focus:border-[#BC8242]"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Phone & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0300 1234567"
                      value={customerInfo.phone}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, phone: e.target.value });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-sm focus:outline-none ${
                        formErrors.phone ? "border-red-500 bg-red-50/20" : "border-stone-300 focus:border-[#BC8242]"
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-red-500 mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. name@gmail.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-sm focus:outline-none focus:border-[#BC8242]"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Karachi, Lahore, Islamabad"
                    value={customerInfo.city}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, city: e.target.value });
                      if (formErrors.city) setFormErrors({ ...formErrors, city: null });
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-sm focus:outline-none mb-2 ${
                      formErrors.city ? "border-red-500 bg-red-50/20" : "border-stone-300 focus:border-[#BC8242]"
                    }`}
                  />
                  
                  {/* City Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CITIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleSelectCity(c)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          customerInfo.city.toLowerCase() === c.toLowerCase()
                            ? "bg-[#BC8242] text-white border-[#BC8242]"
                            : "bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {formErrors.city && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.city}</p>
                  )}
                </div>

                {/* Complete Address */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Street Address & House / Flat # <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="House/Apartment #, Street, Block/Sector, Area, Nearby Landmark..."
                    value={customerInfo.address}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, address: e.target.value });
                      if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-sm focus:outline-none ${
                      formErrors.address ? "border-red-500 bg-red-50/20" : "border-stone-300 focus:border-[#BC8242]"
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.address}</p>
                  )}
                </div>

                {/* Delivery Notes */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Special Delivery Notes <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call before arrival, leave with security"
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-sm focus:outline-none focus:border-[#BC8242]"
                  />
                </div>

                {/* PAYMENT METHOD: STRICTLY COD */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                    Payment Method
                  </h3>

                  <div className="p-4 bg-amber-50/60 rounded-md border-2 border-[#BC8242] flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-[#BC8242] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          <Banknote size={16} className="text-[#BC8242]" />
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-xs bg-[#BC8242]/15 text-[#915e27] font-bold px-2.5 py-0.5 rounded-full">
                          Only Option
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Pay conveniently in cash when the courier hands over your fragrance parcel.
                      </p>
                      <div className="mt-2 pt-2 border-t border-amber-200/80 flex items-center gap-2 text-xs text-stone-600 font-medium">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span>100% Risk-Free. No bank transfer or card details needed.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit button on mobile/desktop */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full bg-[#BC8242] hover:bg-[#a66f33] active:bg-[#925c27] text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirming Your COD Order...
                      </span>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Confirm & Place Order (Rs{grandTotal.toLocaleString()} COD)
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-xs space-y-6 sticky top-6">
              <h2 className="font-serif-luxury text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">
                Order Summary ({items.reduce((a, b) => a + b.quantity, 0)} Items)
              </h2>

              {/* Items List */}
              <div className="space-y-4 max-h-72 overflow-y-auto divide-y divide-stone-100 pr-1">
                {items.map((it) => (
                  <div key={it.id} className="pt-3 first:pt-0 flex gap-3.5 items-center">
                    <div className="relative w-14 h-14 bg-[#f7f6f2] rounded-sm overflow-hidden border border-stone-200 shrink-0">
                      <Image
                        src={it.image}
                        alt={it.name}
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif-luxury text-xs sm:text-sm font-semibold text-stone-900 truncate">
                        {it.name}
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Size: {it.size} × {it.quantity}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-stone-900 shrink-0">
                      Rs{(it.price * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="pt-2 border-t border-stone-200 space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 block">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. UTOOR10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-sm focus:outline-none focus:border-[#BC8242] uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="px-4 py-2 bg-stone-900 hover:bg-[#BC8242] text-white text-xs font-semibold rounded-sm transition-colors uppercase tracking-wider"
                  >
                    Apply
                  </button>
                </div>
                {couponSuccess && (
                  <p className="text-[11px] text-emerald-600 font-medium">✓ {couponSuccess}</p>
                )}
                {couponError && (
                  <p className="text-[11px] text-red-500 font-medium">✕ {couponError}</p>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="pt-3 border-t border-stone-200 space-y-2 text-xs sm:text-sm text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">Rs{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-Rs{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-stone-900">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE (Nationwide)</span>
                    ) : (
                      `Rs${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-3 border-t border-stone-200">
                  <span>Total Payable (COD)</span>
                  <span className="text-[#BC8242] font-serif-luxury text-xl">
                    Rs{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trust assurances */}
              <div className="p-3.5 bg-stone-50 rounded-md border border-stone-200/80 text-xs text-stone-600 space-y-2">
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-[#BC8242]" />
                  <span>2 to 4 Days Nationwide Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#BC8242]" />
                  <span>100% Pure Alcohol-Free Concentrated Attar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Banknote size={15} className="text-[#BC8242]" />
                  <span>Inspect parcel upon arrival & pay cash</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
