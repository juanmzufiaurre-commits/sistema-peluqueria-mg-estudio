"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface PeriodItem {
  key: string;
  href: string;
  /** Línea chica de arriba (año, "Este mes", "Esta semana") */
  top: string;
  /** Texto principal (mes o rango de días) */
  main: string;
  bookings: number;
}

/** Tira de períodos (meses o semanas) como la de días de la agenda: flechas a los costados y turnos de cada uno. */
export function PeriodRail({ items, selected, label, wide = false }: { items: PeriodItem[]; selected: string; label: string; wide?: boolean }) {
  const stripRef = useRef<HTMLUListElement>(null);
  const index = items.findIndex((i) => i.key === selected);
  const prev = index > 0 ? items[index - 1] : null;
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : null;

  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>("[aria-current=page]");
    if (!strip || !active) return;
    strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2, behavior: "smooth" });
  }, [selected]);

  return (
    <nav aria-label={label} className="flex items-stretch gap-2">
      <Arrow href={prev?.href ?? null} label="Anterior" icon={ChevronLeft} />
      <ul ref={stripRef} className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((m) => {
          const active = m.key === selected;
          return (
            <li key={m.key} className="shrink-0 snap-center">
              <Link
                href={m.href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-sm border py-3 transition-all duration-300",
                  wide ? "w-32" : "w-20",
                  active ? "border-ink bg-ink/[0.08] shadow-[0_0_24px_-8px] shadow-ink/50" : "border-ink/10 bg-ink/[0.02] hover:border-ink/30",
                )}
              >
                <span className={cn("text-[0.6rem] uppercase tracking-[0.2em]", active ? "text-ink" : "text-muted")}>{m.top}</span>
                <span className={cn("font-light capitalize leading-none", wide ? "text-base" : "text-xl")}>{m.main}</span>
                <span className={cn("mt-1 text-[0.65rem] tabular-nums", m.bookings ? "text-ink-soft" : "text-muted/60")}>
                  {m.bookings} {m.bookings === 1 ? "turno" : "turnos"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Arrow href={next?.href ?? null} label="Siguiente" icon={ChevronRight} />
    </nav>
  );
}

function Arrow({ href, label, icon: Icon }: { href: string | null; label: string; icon: typeof ChevronLeft }) {
  const cls = "flex w-9 shrink-0 items-center justify-center rounded-sm border border-ink/10 text-ink-soft transition-colors";
  if (!href)
    return (
      <span aria-hidden className={cn(cls, "opacity-30")}>
        <Icon className="size-4" />
      </span>
    );
  return (
    <Link href={href} scroll={false} aria-label={label} title={label} className={cn(cls, "hover:border-ink hover:text-ink")}>
      <Icon aria-hidden className="size-4" />
    </Link>
  );
}
