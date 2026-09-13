"use client";

import Image from "next/image";
import { CATEGORIES } from "@/data/storeData";
import { ArrowUpRight } from "lucide-react";

export default function CategoryShowcase({ onSelectCategory }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {CATEGORIES.map((category) => (
        <div
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className="group relative h-64 sm:h-72 md:h-80 rounded-xs overflow-hidden cursor-pointer bg-stone-100 border border-stone-200 transition-all duration-300 hover:shadow-lg"
        >
          {/* Background Image */}
          <div className="relative w-full h-full">
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-108"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/25 to-transparent transition-opacity duration-300 group-hover:from-stone-950/90" />
          </div>

          {/* Category Content */}
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 flex flex-col justify-end text-left text-white">
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-medium mb-1">
              {category.count}
            </span>
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-serif-luxury font-bold tracking-[0.14em] uppercase text-white group-hover:text-amber-200 transition-colors">
                {category.name}
              </h3>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:bg-[#BC8242]">
                <ArrowUpRight size={15} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-stone-300 mt-1 line-clamp-1">
              {category.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
