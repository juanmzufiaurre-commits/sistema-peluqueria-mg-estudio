"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Images, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS: { href: "/" | "/profesionales" | "/catalogo"; label: string; icon: LucideIcon }[] = [
  { href: "/profesionales", label: "Profesionales", icon: Users },
  { href: "/", label: "Agendar turno", icon: CalendarDays },
  { href: "/catalogo", label: "Catálogo", icon: Images },
];

/**
 * Menú de los tres apartados públicos. El activo se ve en crema y un poco más grande; un aro
 * se desliza hasta su ícono para que se entienda en qué apartado estás.
 */
export function SectionNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label="Apartados" className="w-full max-w-xl pb-6 pt-10">
      <ul className="grid grid-cols-3 items-end">
        {SECTIONS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-col items-center gap-3 rounded-sm py-2 focus-visible:outline-offset-4"
              >
                <span className="relative flex size-14 items-center justify-center">
                  {active && (
                    <motion.span
                      layoutId="section-ring"
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full border border-ink bg-ink/[0.07] shadow-[0_0_28px_-6px] shadow-ink/40"
                    />
                  )}
                  <Icon
                    aria-hidden
                    strokeWidth={1.4}
                    className={cn(
                      "relative transition-all duration-300",
                      active ? "size-6 text-ink" : "size-5 text-muted group-hover:text-ink-soft",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap uppercase transition-all duration-300",
                    // En celular cada columna mide ~115px: el tracking se abre recién en pantallas más anchas.
                    active
                      ? "text-[0.72rem] font-medium tracking-[0.12em] text-ink sm:text-[0.8rem] sm:tracking-[0.2em]"
                      : "text-[0.6rem] tracking-[0.16em] text-muted group-hover:text-ink-soft sm:text-[0.66rem] sm:tracking-[0.2em]",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
