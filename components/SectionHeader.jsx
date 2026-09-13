export default function SectionHeader({ title, subtitle, className = "" }) {
  return (
    <div className={`text-center my-6 sm:my-10 md:my-14 ${className}`}>
      {subtitle && (
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#BC8242] font-semibold block mb-1 sm:mb-2">
          {subtitle}
        </span>
      )}
      <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-4xl mx-auto px-3 sm:px-4">
        <div className="h-[1px] bg-stone-300 flex-1 min-w-[20px]"></div>
        <h2 className="text-sm sm:text-lg md:text-2xl font-serif-luxury font-semibold uppercase tracking-[0.1em] sm:tracking-[0.16em] text-stone-900 whitespace-nowrap px-1 sm:px-2">
          {title}
        </h2>
        <div className="h-[1px] bg-stone-300 flex-1 min-w-[20px]"></div>
      </div>
    </div>
  );
}
