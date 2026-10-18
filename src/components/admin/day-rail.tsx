import Link from "next/link";
import { dayParts } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DayCount } from "@/types/admin";

/** Tira horizontal de días (como el selector de la reserva): cuántos turnos hay en cada uno. */
export function DayRail({ days, selected, today }: { days: DayCount[]; selected: string; today: string }) {
  return (
    <nav aria-label="Días">
      <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const p = dayParts(d.date);
          const active = d.date === selected;
          const isToday = d.date === today;
          return (
            <li key={d.date} className="shrink-0 snap-start">
              <Link
                href={isToday ? "/admin" : `/admin?d=${d.date}`}
                aria-current={active ? "date" : undefined}
                aria-label={`${p.weekday} ${p.day} ${p.month}: ${d.count} ${d.count === 1 ? "turno" : "turnos"}`}
                scroll={false}
                className={cn(
                  "flex w-[4.5rem] flex-col items-center gap-1 rounded-sm border py-3 transition-all duration-300",
                  active ? "border-ink bg-ink/[0.08] shadow-[0_0_24px_-8px] shadow-ink/50" : "border-ink/10 bg-ink/[0.02] hover:border-ink/30",
                )}
              >
                <span className={cn("text-[0.6rem] uppercase tracking-[0.2em]", active ? "text-ink" : "text-muted")}>{isToday ? "Hoy" : p.weekday}</span>
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
    </nav>
  );
}
