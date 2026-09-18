"use client";

import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/data/storeData";
import { ArrowUpRight } from "lucide-react";

export default function CategoryShowcase({ onSelectCategory }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {CATEGORIES.map((category) => (
        <Link
          key={category.id}
          href={`/shop?category=${category.id}`}
          onClick={(e) => {
            if (onSelectCategory) {
              e.preventDefault();
              onSelectCategory(category.id);
            }
          }}
          className="group relative h-48 sm:h-64 md:h-80 rounded-xs overflow-hidden cursor-pointer bg-stone-100 border border-stone-200 transition-all duration-300 hover:shadow-lg block"
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
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent transition-opacity duration-300 group-hover:from-stone-950/90" />
          </div>

          {/* Category Content */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5 flex flex-col justify-end text-left text-white">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-amber-300 font-medium mb-0.5">
              {category.count}
            </span>
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-lg md:text-xl font-serif-luxury font-bold tracking-[0.1em] sm:tracking-[0.14em] uppercase text-white group-hover:text-amber-200 transition-colors">
                {category.name}
              </h3>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#BC8242]">
                <ArrowUpRight size={13} className="text-white" />
              </div>
            </div>
            <p className="hidden sm:block text-xs text-stone-300 mt-1 line-clamp-1">
              {category.subtext}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
