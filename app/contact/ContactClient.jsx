"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE_CONFIG } from "@/data/storeData";
import {
  Phone,
  Mail,
  Send,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";

export default function ContactClient() {
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    topic: "Product Inquiry",
    message: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const inquiryTopics = [
    "Product Inquiry",
    "Order Tracking",
    "Custom Gift Sets",
    "Wholesale & Bulk",
    "General Question",
  ];

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Please enter your name";
    }
    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Please enter a valid phone number (e.g. 0300 1234567)";
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = "Please write a message of at least 10 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  const handleResetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      topic: "Product Inquiry",
      message: "",
    });
    setFormErrors({});
    setIsSubmitted(false);
  };

  const whatsappDirectUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    formData.message
      ? `Hello Utoorat e Azami! My name is ${formData.name}. Regarding ${formData.topic}: ${formData.message}`
      : SITE_CONFIG.whatsappMessage
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900">
      <Navbar />

      {/* Simple Clean Header Banner */}
      <section className="bg-[#1c1917] text-white py-10 sm:py-14 text-center border-b border-[#BC8242]/30 px-4">
        <div className="max-w-2xl mx-auto space-y-2.5">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-[11px] text-stone-400 uppercase tracking-widest">
            <Link href="/" className="hover:text-[#BC8242] transition-colors">
              Home
            </Link>
            <ChevronRight size={12} className="text-[#BC8242]" />
            <span className="text-white font-semibold">Contact Us</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif-luxury font-bold tracking-wider uppercase text-white">
            Contact Us
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 font-light max-w-md mx-auto leading-relaxed">
            Have questions about an attar or need order assistance? Send us a message below or connect with us directly.
          </p>

          {/* Quick Direct Contacts */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-300">
            <a
              href={`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
                SITE_CONFIG.whatsappMessage
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <MessageSquare size={14} className="text-emerald-400" />
              <span>WhatsApp: +{SITE_CONFIG.whatsappNumber}</span>
            </a>
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/[\s]/g, "")}`}
              className="flex items-center gap-1.5 hover:text-[#BC8242] transition-colors"
            >
              <Phone size={14} className="text-[#BC8242]" />
              <span>{SITE_CONFIG.phone}</span>
            </a>
            <a
              href="mailto:support@utoorateazami.com"
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
            >
              <Mail size={14} className="text-amber-300" />
              <span>support@utoorateazami.com</span>
            </a>
          </div>
        </div>
      </section>

      {/* Centered Clean Form Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="bg-white border border-stone-200 rounded-xs p-6 sm:p-8 shadow-xs">
          {isSubmitted ? (
            /* Success State */
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-stone-900">
                Message Sent Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-stone-900">{formData.name}</strong>. We have received your inquiry regarding &quot;{formData.topic}&quot; and will get back to you shortly at {formData.phone}.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-[#BC8242] text-white rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Send Another Inquiry
                </button>
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Also Send on WhatsApp</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          ) : (
            /* Form with exact same styling & inputs */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-stone-200 pb-4">
                <h2 className="font-serif-luxury text-lg font-bold text-stone-900 uppercase tracking-wide">
                  Send An Inquiry
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Fill out the form below and we will get in touch with you.
                </p>
              </div>

              {/* Inquiry Topic Pills */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Inquiry Topic
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {inquiryTopics.map((topic) => (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => setFormData({ ...formData, topic })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        formData.topic === topic
                          ? "bg-[#BC8242] text-white shadow-2xs"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Ali"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                    className={`w-full px-3 py-2 bg-stone-50 border rounded-xs text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white transition-all ${
                      formErrors.name ? "border-red-500" : "border-stone-300 focus:border-[#BC8242]"
                    }`}
                  />
                  {formErrors.name && (
                    <span className="text-[11px] text-red-600 mt-1 block">
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0300 1234567"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                    }}
                    className={`w-full px-3 py-2 bg-stone-50 border rounded-xs text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white transition-all ${
                      formErrors.phone ? "border-red-500" : "border-stone-300 focus:border-[#BC8242]"
                    }`}
                  />
                  {formErrors.phone && (
                    <span className="text-[11px] text-red-600 mt-1 block">
                      {formErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-stone-400 text-[10px] normal-case">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xs text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#BC8242] focus:bg-white transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-stone-400">
                    {formData.message.length} characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Tell us what you'd like to ask or inquire about..."
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (formErrors.message) setFormErrors({ ...formErrors, message: null });
                  }}
                  className={`w-full px-3 py-2 bg-stone-50 border rounded-xs text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white transition-all resize-y ${
                    formErrors.message ? "border-red-500" : "border-stone-300 focus:border-[#BC8242]"
                  }`}
                ></textarea>
                {formErrors.message && (
                  <span className="text-[11px] text-red-600 mt-1 block">
                    {formErrors.message}
                  </span>
                )}
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-stone-900 hover:bg-[#BC8242] active:bg-[#925c24] text-white text-xs font-bold uppercase tracking-widest rounded-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Or Inquire Via WhatsApp</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
