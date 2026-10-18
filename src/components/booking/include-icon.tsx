import { Check, Coffee, Droplets, Gamepad2, Palette, Scissors, type LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { DyeBowlIcon, HighlightCapIcon, RazorIcon } from "@/components/ui/service-icons";

type IconComponent = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

// Los ítems de "Qué incluye" son texto libre del panel: se elige el ícono por palabra clave.
// El orden importa ("Decoloración global" antes que "Corte" por si un ítem tiene las dos).
const RULES: [RegExp, IconComponent][] = [
  [/decolora|global|platin/, DyeBowlIcon], // teñido de todo el pelo
  [/mecha|reflejo|claritos/, HighlightCapIcon], // solo las puntas, con gorra
  [/color|tintura|tinte/, Palette],
  [/barba|afeitad|perfilad/, RazorIcon],
  [/corte|fade|degrad/, Scissors],
  [/lavado|shampoo|champ/, Droplets],
  [/cafe|bebida|mate/, Coffee],
  [/ps5|play|consola|juego/, Gamepad2],
];

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Ícono que representa un ítem de servicio ("Corte", "Barba", "Lavado"...). Sin coincidencia: un check. */
export function IncludeIcon({ item, className }: { item: string; className?: string }) {
  const text = normalize(item);
  const Icon = RULES.find(([re]) => re.test(text))?.[1] ?? Check;
  return <Icon aria-hidden strokeWidth={1.4} className={className} />;
}
