import type { ProductHighlight } from '@/types/product';
import { Flame, Leaf, Clock, Award, Wind, Utensils, Star, Gift, Zap, ShieldCheck, Heart } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  leaf: Leaf,
  clock: Clock,
  award: Award,
  wind: Wind,
  utensils: Utensils,
  star: Star,
  gift: Gift,
  zap: Zap,
  shield: ShieldCheck,
  heart: Heart,
};

interface ProductHighlightsProps {
  highlights: ProductHighlight[];
}

export function ProductHighlights({ highlights }: ProductHighlightsProps) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {highlights.map((item, idx) => {
        const IconComponent = iconMap[item.icon] || ShieldCheck;
        return (
          <div
            key={idx}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50 border border-cream-200/70"
          >
            <div className="h-8 w-8 rounded-lg bg-cream-100 flex items-center justify-center text-maroon-900 shrink-0 border border-gold-500/20">
              <IconComponent className="h-4 w-4" />
            </div>
            <span className="font-body text-xs font-semibold text-dark-800 leading-tight">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
