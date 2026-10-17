import Link from "next/link";
import { dayParts } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DayCount } from "@/types/admin";

export function DayRail({ days, selected, today }: { days: DayCount[]; selected: string; today: string }) {
  return (
    <nav aria-label="Días">
      <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {days.map((d) => {
          const p = dayParts(d.date);
          const active = d.date === selected;
          return (
            <li key={d.date} className="shrink-0">
              <Link
                href={d.date === today ? "/admin" : `/admin?d=${d.date}`}
                aria-current={active ? "date" : undefined}
                scroll={false}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-sm border px-4 py-3 transition-colors",
                  active ? "border-ink bg-ink text-cream" : "border-line bg-surface hover:border-ink",
                )}
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-2xl leading-none">{p.day}</span>
                  <span className="text-xs uppercase tracking-[0.15em]">
                    {p.weekday} {p.month}
                  </span>
                </span>
                <span
                  className={cn(
                    "min-w-7 rounded-full px-2 py-0.5 text-center text-xs",
                    d.count === 0 ? "text-current/50" : active ? "bg-cream text-ink" : "bg-ink text-cream",
                  )}
                  aria-label={`${d.count} turnos`}
                >
                  {d.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
