"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Images, MapPin, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS: { href: "/" | "/profesionales" | "/catalogo" | "/ubicacion"; label: string; icon: LucideIcon }[] = [
  { href: "/profesionales", label: "Profesionales", icon: Users },
  { href: "/", label: "Agendar turno", icon: CalendarDays },
  { href: "/catalogo", label: "Catálogo", icon: Images },
  { href: "/ubicacion", label: "Ubicación", icon: MapPin },
];

// Entrada después de la intro: primero "Agendar turno" y enseguida el resto, alejándose de él.
const REVEAL_DELAY = [0.14, 0, 0.14, 0.24];
const REVEAL_FROM_X = [-14, 0, 14, 18];

/**
 * Menú de los cuatro apartados públicos. El activo se ve en crema y un poco más grande; un aro
 * se desliza hasta su ícono para que se entienda en qué apartado estás.
 * `revealed` en false lo deja oculto (desenfocado) hasta que termina la intro de la portada.
 */
export function SectionNav({ revealed = true, instant = false }: { revealed?: boolean; instant?: boolean }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label="Apartados" className="w-full max-w-xl pb-6 pt-8" inert={!revealed}>
      <ul className="grid grid-cols-4 items-start gap-x-1">
        {SECTIONS.map(({ href, label, icon: Icon }, i) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <motion.li
              key={href}
              initial={false}
              animate={revealed ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" } : { opacity: 0, x: REVEAL_FROM_X[i], y: 14, filter: "blur(10px)" }}
              transition={reduceMotion || instant ? { duration: 0 } : { duration: 0.7, delay: revealed ? REVEAL_DELAY[i] : 0, ease: [0.22, 1, 0.36, 1] }}
            >
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
                    "text-center uppercase leading-snug transition-all duration-300 sm:whitespace-nowrap",
                    // En celular cada columna mide ~85px: "Agendar turno" baja a dos renglones, "Profesionales"
                    // (una sola palabra) tiene que entrar justo, y el tracking se abre recién en pantallas más anchas.
                    active
                      ? "text-[0.6rem] font-medium tracking-[0.04em] text-ink sm:text-[0.78rem] sm:tracking-[0.18em]"
                      : "text-[0.58rem] tracking-[0.06em] text-muted group-hover:text-ink-soft sm:text-[0.64rem] sm:tracking-[0.18em]",
                  )}
                >
                  {label}
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}
