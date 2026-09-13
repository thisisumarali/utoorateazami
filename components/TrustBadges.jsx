import { ShieldCheck, Clock, Truck, Sparkles } from "lucide-react";
import { TRUST_FEATURES } from "@/data/storeData";

export default function TrustBadges() {
  const iconMap = {
    ShieldCheck: ShieldCheck,
    Clock: Clock,
    Truck: Truck,
    Sparkles: Sparkles,
  };

  return (
    <div className="border-y border-stone-200 bg-stone-50/60 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {TRUST_FEATURES.map((item, idx) => {
            const IconComponent = iconMap[item.icon] || Sparkles;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xs bg-white border border-stone-200/80 shadow-xs"
              >
                <div className="w-11 h-11 rounded-full bg-[#fdf6ee] text-[#BC8242] flex items-center justify-center shrink-0 border border-[#f0dfc8]">
                  <IconComponent size={22} />
                </div>
                <div>
                  <h4 className="font-serif-luxury text-sm font-bold text-stone-900 uppercase tracking-wider">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
