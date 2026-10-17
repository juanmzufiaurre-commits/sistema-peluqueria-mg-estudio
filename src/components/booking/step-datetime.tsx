"use client";

import { use, useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import type { AvailableDay } from "@/actions/availability";
import { dayParts } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TimeCarousel } from "./time-carousel";

interface Props {
  availability: Promise<ActionResult<AvailableDay[]>>;
  onSelect: (startsAtIso: string) => void;
  onRetry: () => void;
}

/** Se suspende hasta que llegan los horarios; el padre provee el Suspense con el esqueleto. */
export function StepDateTime({ availability, onSelect, onRetry }: Props) {
  const result = use(availability);
  const days = result.success ? (result.data ?? []) : [];
  const firstWithSlots = days.find((d) => d.slots.length > 0)?.date;
  const [selected, setSelected] = useState<string | undefined>(firstWithSlots);

  if (!result.success) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="alert" className="text-st-cancelled">
          {result.error}
        </p>
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!firstWithSlots) {
    return <p className="text-muted">No hay horarios disponibles en los próximos días. Probá más tarde o escribinos por WhatsApp.</p>;
  }

  const slots = days.find((d) => d.date === selected)?.slots ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div
        role="listbox"
        aria-label="Elegí un día"
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((d) => {
          const p = dayParts(d.date);
          const disabled = d.slots.length === 0;
          const active = d.date === selected;
          return (
            <button
              key={d.date}
              type="button"
              role="option"
              aria-selected={active}
              disabled={disabled}
              onClick={() => setSelected(d.date)}
              className={cn(
                "flex min-w-16 shrink-0 snap-start flex-col items-center gap-1 rounded-sm border px-3 py-3 transition-colors",
                active ? "border-ink bg-ink text-cream" : "border-line bg-surface hover:border-ink",
                disabled && "cursor-not-allowed opacity-35 hover:border-line",
              )}
            >
              <span className="label-wide !tracking-[0.2em]">{p.weekday}</span>
              <span className="text-2xl font-light leading-none tabular-nums">{p.day}</span>
              <span className="text-xs uppercase text-current/70">{p.month}</span>
            </button>
          );
        })}
      </div>

      <div>
        <p className="label-wide mb-4 text-ink-soft">Horarios disponibles</p>
        {/* key: al cambiar de día la rueda arranca de nuevo en el primer horario */}
        <TimeCarousel key={selected} slots={slots} onSelect={onSelect} />
      </div>
    </div>
  );
}

export function StepDateTimeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando horarios" className="flex animate-pulse flex-col gap-8">
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-24 w-16 shrink-0 rounded-sm bg-cream-deep" />
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 py-4">
        {[0.25, 0.55, 1, 0.55, 0.25].map((o, i) => (
          <div key={i} className="h-8 w-14 rounded-sm bg-cream-deep" style={{ opacity: o }} />
        ))}
      </div>
    </div>
  );
}
