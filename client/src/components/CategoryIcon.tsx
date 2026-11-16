import { Car, Coffee, Cpu, GraduationCap, Home, Hotel, Newspaper, Palette, Shirt, ShoppingBag, Sparkles, Wrench, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  ShoppingBag, Coffee, Shirt, Cpu, Sparkles, Wrench, Building2, Newspaper, Palette, Home, Hotel, GraduationCap, Car,
};

export function CategoryIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = ICONS[name] || Sparkles;
  return <Icon size={size} strokeWidth={1.7} />;
}
