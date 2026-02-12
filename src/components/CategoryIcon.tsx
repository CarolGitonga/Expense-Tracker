import {
  Utensils,
  Bus,
  Receipt,
  ShoppingBag,
  Film,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  Food:          { icon: Utensils,    bg: "bg-orange-100", fg: "text-orange-600" },
  Transport:     { icon: Bus,         bg: "bg-blue-100",   fg: "text-blue-600" },
  Bills:         { icon: Receipt,     bg: "bg-rose-100",   fg: "text-rose-600" },
  Shopping:      { icon: ShoppingBag, bg: "bg-purple-100", fg: "text-purple-600" },
  Entertainment: { icon: Film,        bg: "bg-emerald-100", fg: "text-emerald-600" },
};

const fallback = { icon: Receipt, bg: "bg-gray-100", fg: "text-gray-500" };

interface CategoryIconProps {
  category: string;
  size?: "sm" | "md";
}

export default function CategoryIcon({ category, size = "md" }: CategoryIconProps) {
  const { icon: Icon, bg, fg } = iconMap[category] ?? fallback;
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <span className={`inline-flex items-center justify-center rounded-lg ${dim} ${bg}`}>
      <Icon className={fg} size={iconSize} strokeWidth={2} />
    </span>
  );
}
