export default function SectionHeader({ title, subtitle, className = "" }) {
  return (
    <div className={`text-center my-10 md:my-14 ${className}`}>
      {subtitle && (
        <span className="text-xs uppercase tracking-[0.25em] text-[#BC8242] font-semibold block mb-2">
          {subtitle}
        </span>
      )}
      <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto px-4">
        <div className="h-[1px] bg-stone-300 flex-1"></div>
        <h2 className="text-xl md:text-2xl font-serif-luxury font-semibold uppercase tracking-[0.18em] text-stone-900 whitespace-nowrap px-2">
          {title}
        </h2>
        <div className="h-[1px] bg-stone-300 flex-1"></div>
      </div>
    </div>
  );
}
