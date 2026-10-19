"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { addMonths, monthShort } from "@/lib/months";
import { cn } from "@/lib/utils";
import type { MonthSummary } from "@/server/services/agenda";

const hrefFor = (month: string) => `/admin/reportes?m=${month}`;

/** Tira de meses (como la de días en la agenda): flechas a los costados y turnos de cada mes. */
export function MonthRail({ months, selected, current }: { months: MonthSummary[]; selected: string; current: string }) {
  const stripRef = useRef<HTMLUListElement>(null);
  const first = months[0]?.month ?? selected;
  const last = months[months.length - 1]?.month ?? selected;

  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>("[aria-current=page]");
    if (!strip || !active) return;
    strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2, behavior: "smooth" });
  }, [selected]);

  return (
    <nav aria-label="Meses" className="flex items-stretch gap-2">
      <Arrow href={selected > first ? hrefFor(addMonths(selected, -1)) : null} label="Mes anterior" icon={ChevronLeft} />
      <ul ref={stripRef} className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {months.map((m) => {
          const active = m.month === selected;
          return (
            <li key={m.month} className="shrink-0 snap-center">
              <Link
                href={hrefFor(m.month)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-20 flex-col items-center gap-1 rounded-sm border py-3 transition-all duration-300",
                  active ? "border-ink bg-ink/[0.08] shadow-[0_0_24px_-8px] shadow-ink/50" : "border-ink/10 bg-ink/[0.02] hover:border-ink/30",
                )}
              >
                <span className={cn("text-[0.6rem] uppercase tracking-[0.2em]", m.month === current ? "text-ink" : "text-muted")}>
                  {m.month === current ? "Este mes" : m.month.slice(0, 4)}
                </span>
                <span className="text-xl font-light capitalize leading-none">{monthShort(m.month)}</span>
                <span className={cn("mt-1 text-[0.65rem] tabular-nums", m.bookings ? "text-ink-soft" : "text-muted/60")}>
                  {m.bookings} {m.bookings === 1 ? "turno" : "turnos"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Arrow href={selected < last ? hrefFor(addMonths(selected, 1)) : null} label="Mes siguiente" icon={ChevronRight} />
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
