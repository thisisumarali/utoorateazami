"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { HERO_SLIDES } from "@/data/storeData";

export default function HeroSlider({ onExploreClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div
      className="relative w-full h-[460px] sm:h-[520px] md:h-[620px] overflow-hidden bg-stone-900 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image Slides */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Background Image with subtle zoom */}
            <div className={`relative w-full h-full ${isActive ? "animate-subtle-zoom" : ""}`}>
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                className="object-cover object-center brightness-[0.85] contrast-[1.05]"
              />
              {/* Luxury Light-Vignette Overlay for crystal clear readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent sm:from-black/65 sm:via-black/35" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
            </div>

            {/* Slide Content Overlay */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 w-full">
                <div className="max-w-xl md:max-w-2xl text-left text-white space-y-3 sm:space-y-4 md:space-y-6">
                  {/* Subtle Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BC8242]/90 text-white text-[9px] sm:text-xs tracking-[0.2em] font-semibold uppercase shadow-lg backdrop-blur-sm">
                    <Sparkles size={11} className="text-amber-200" />
                    {slide.badge}
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif-luxury font-bold leading-[1.2] tracking-tight drop-shadow-md">
                    {slide.title}
                  </h1>

                  {/* Subtitle Description */}
                  <p className="text-xs sm:text-sm md:text-base text-stone-200 font-light leading-relaxed max-w-lg drop-shadow line-clamp-2 sm:line-clamp-none">
                    {slide.subtitle}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                    <button
                      onClick={() => onExploreClick(slide.primaryTarget)}
                      className="flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[#BC8242] hover:bg-[#a56f33] active:bg-[#905a25] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-lg text-center"
                    >
                      {slide.primaryCta}
                    </button>
                    <button
                      onClick={() => onExploreClick(slide.secondaryTarget)}
                      className="flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs sm:text-sm font-semibold tracking-wider uppercase backdrop-blur-sm transition-all text-center"
                    >
                      {slide.secondaryCta}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Desktop Navigation Arrows (hidden on mobile to prevent overlapping text) */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/25 hover:bg-white/50 text-white items-center justify-center backdrop-blur-md transition-all opacity-80 hover:opacity-100 hover:scale-105"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/25 hover:bg-white/50 text-white items-center justify-center backdrop-blur-md transition-all opacity-80 hover:opacity-100 hover:scale-105"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators with Mobile Nav Controls */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? "w-6 sm:w-8 h-1.5 sm:h-2 bg-[#BC8242]"
                : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/60 hover:bg-white"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
