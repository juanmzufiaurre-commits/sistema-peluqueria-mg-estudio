"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, CalendarDays, Images, Scissors, SlidersHorizontal, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; short: string; icon: LucideIcon; hint: string }[] = [
  { href: "/admin", label: "Agenda", short: "Agenda", icon: CalendarDays, hint: "Turnos del día" },
  { href: "/admin/reportes", label: "Reportes", short: "Reportes", icon: BarChart3, hint: "Historial por mes" },
  { href: "/admin/servicios", label: "Servicios", short: "Servicios", icon: Scissors, hint: "Precios y duración" },
  { href: "/admin/equipo", label: "Equipo", short: "Equipo", icon: Users, hint: "Perfiles públicos" },
  { href: "/admin/catalogo", label: "Catálogo", short: "Catálogo", icon: Images, hint: "Fotos de cortes" },
  { href: "/admin/configuracion", label: "Configuración", short: "Ajustes", icon: SlidersHorizontal, hint: "Horarios y local" },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
}

/** Menú lateral (compu): ícono, nombre y para qué sirve cada sección. */
export function AdminSideNav() {
  const isActive = useActive();
  const reduceMotion = useReducedMotion();
  return (
    <nav aria-label="Secciones" className="flex flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon, hint }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("group relative flex items-center gap-3 rounded-sm px-3 py-2.5 transition-colors", active ? "text-ink" : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink")}
          >
            {active && (
              <motion.span
                layoutId="admin-side-active"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                className="absolute inset-0 rounded-sm border border-ink/15 bg-ink/[0.06]"
              />
            )}
            <span
              className={cn(
                "relative flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                active ? "border-ink bg-ink/[0.08] shadow-[0_0_20px_-6px] shadow-ink/50" : "border-ink/10 group-hover:border-ink/30",
              )}
            >
              <Icon aria-hidden strokeWidth={1.5} className="size-4" />
            </span>
            <span className="relative min-w-0">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block truncate text-xs text-muted">{hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Barra de pestañas fija abajo (celular), como en una app. */
export function AdminTabBar() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {LINKS.map(({ href, short, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-1 py-2.5">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border transition-all duration-300",
                    active ? "border-ink bg-ink/[0.08] text-ink shadow-[0_0_20px_-6px] shadow-ink/50" : "border-transparent text-muted",
                  )}
                >
                  <Icon aria-hidden strokeWidth={1.5} className="size-[18px]" />
                </span>
                <span className={cn("text-[0.55rem] uppercase tracking-[0.06em]", active ? "font-medium text-ink" : "text-muted")}>{short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
