"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { HERO_SLIDES } from "@/data/storeData";

export default function HeroSlider({ onExploreClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  return (
    <div
      className="relative w-full h-[480px] sm:h-[540px] md:h-[620px] overflow-hidden bg-stone-900 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
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
                className="object-cover object-center brightness-[0.88] contrast-[1.05]"
              />
              {/* Luxury Light-Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            </div>

            {/* Slide Content Overlay */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
                <div className="max-w-2xl text-left text-white space-y-4 md:space-y-6">
                  {/* Subtle Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BC8242]/90 text-white text-[10px] md:text-xs tracking-[0.25em] font-semibold uppercase shadow-lg backdrop-blur-sm">
                    <Sparkles size={12} className="text-amber-200" />
                    {slide.badge}
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif-luxury font-bold leading-[1.15] tracking-tight drop-shadow-md">
                    {slide.title}
                  </h1>

                  {/* Subtitle Description */}
                  <p className="text-sm sm:text-base md:text-lg text-stone-200 font-light leading-relaxed max-w-xl drop-shadow">
                    {slide.subtitle}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => onExploreClick(slide.primaryTarget)}
                      className="px-6 sm:px-8 py-3 rounded-full bg-[#BC8242] hover:bg-[#a56f33] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all transform hover:-translate-y-0.5 shadow-lg shadow-black/25"
                    >
                      {slide.primaryCta}
                    </button>
                    <button
                      onClick={() => onExploreClick(slide.secondaryTarget)}
                      className="px-6 sm:px-8 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs sm:text-sm font-semibold tracking-wider uppercase backdrop-blur-sm transition-all transform hover:-translate-y-0.5"
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

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/25 hover:bg-white/50 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 hover:opacity-100 hover:scale-105"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/25 hover:bg-white/50 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 hover:opacity-100 hover:scale-105"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? "w-8 h-2 bg-[#BC8242]"
                : "w-2 h-2 bg-white/60 hover:bg-white"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
