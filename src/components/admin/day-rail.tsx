"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { dayParts } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DayCount } from "@/types/admin";

interface Props {
  days: DayCount[];
  selected: string;
  today: string;
  /** Día anterior / siguiente al elegido */
  prev: string;
  next: string;
}

const hrefFor = (date: string, today: string) => (date === today ? "/admin" : `/admin?d=${date}`);

/**
 * Selector de día de la agenda: flechas para ir al día anterior/siguiente a los costados de la
 * tira de días (como el selector de la reserva), con cuántos turnos hay en cada uno.
 */
export function DayRail({ days, selected, today, prev, next }: Props) {
  const stripRef = useRef<HTMLUListElement>(null);

  // El día elegido siempre queda a la vista, aunque la tira tenga más días que el ancho.
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>("[aria-current=date]");
    if (!strip || !active) return;
    const left = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [selected]);

  return (
    <nav aria-label="Días" className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <Arrow href={hrefFor(prev, today)} label="Día anterior" icon={ChevronLeft} />
        <ul ref={stripRef} className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((d) => {
            const p = dayParts(d.date);
            const active = d.date === selected;
            const isToday = d.date === today;
            return (
              <li key={d.date} className="shrink-0 snap-center">
                <Link
                  href={hrefFor(d.date, today)}
                  aria-current={active ? "date" : undefined}
                  aria-label={`${p.weekday} ${p.day} ${p.month}: ${d.count} ${d.count === 1 ? "turno" : "turnos"}`}
                  scroll={false}
                  className={cn(
                    "flex w-[4.25rem] flex-col items-center gap-1 rounded-sm border py-3 transition-all duration-300",
                    active ? "border-ink bg-ink/[0.08] shadow-[0_0_24px_-8px] shadow-ink/50" : "border-ink/10 bg-ink/[0.02] hover:border-ink/30",
                  )}
                >
                  <span className={cn("text-[0.6rem] uppercase tracking-[0.2em]", active || isToday ? "text-ink" : "text-muted")}>{isToday ? "Hoy" : p.weekday}</span>
                  <span className="text-2xl font-light leading-none tabular-nums">{p.day}</span>
                  <span className="text-[0.6rem] uppercase tracking-[0.15em] text-muted">{p.month}</span>
                  <span
                    className={cn(
                      "mt-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.65rem] tabular-nums",
                      d.count === 0 ? "text-muted/60" : active ? "bg-ink text-cream" : "bg-ink/15 text-ink",
                    )}
                  >
                    {d.count === 0 ? "·" : d.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Arrow href={hrefFor(next, today)} label="Día siguiente" icon={ChevronRight} />
      </div>
      {selected !== today && (
        <Link href="/admin" scroll={false} className="self-center text-xs uppercase tracking-[0.15em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline">
          Volver a hoy
        </Link>
      )}
    </nav>
  );
}

function Arrow({ href, label, icon: Icon }: { href: string; label: string; icon: typeof ChevronLeft }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      title={label}
      className="flex w-9 shrink-0 items-center justify-center rounded-sm border border-ink/10 text-ink-soft transition-colors hover:border-ink hover:text-ink"
    >
      <Icon aria-hidden className="size-4" />
    </Link>
  );
}
