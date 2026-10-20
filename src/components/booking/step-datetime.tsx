"use client";

import { use, useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import type { AvailableDay } from "@/actions/availability";
import { dayParts } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PublicStaff } from "@/server/services/team";
import { StaffPicker } from "./staff-picker";
import { TimeCarousel } from "./time-carousel";

interface Props {
  availability: Promise<ActionResult<AvailableDay[]>>;
  /** Sin `team` no se ofrece elegir profesional (p. ej. al reprogramar). */
  team?: PublicStaff[];
  onSelect: (startsAtIso: string, staffId: string | null) => void;
  onRetry: () => void;
}

/** Se suspende hasta que llegan los horarios; el padre provee el Suspense con el esqueleto. */
export function StepDateTime({ availability, team = [], onSelect, onRetry }: Props) {
  const result = use(availability);
  const days = result.success ? (result.data ?? []) : [];
  const firstWithSlots = days.find((d) => d.slots.length > 0)?.date;
  const [selected, setSelected] = useState<string | undefined>(firstWithSlots);
  // Profesional elegido. Si en el horario del centro no está libre, se trata como "sin preferencia".
  const [staffChoice, setStaffChoice] = useState<string | null>(null);

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

  const day = days.find((d) => d.date === selected);
  const slots = day?.slots ?? [];
  const freeAt = (iso: string) => day?.slotStaff?.[slots.indexOf(iso)] ?? [];
  const effectiveStaff = (iso: string) => (staffChoice && freeAt(iso).includes(staffChoice) ? staffChoice : null);

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
        <TimeCarousel
          key={selected}
          slots={slots}
          onSelect={(iso) => onSelect(iso, effectiveStaff(iso))}
          renderExtra={
            team.length > 1 && day?.slotStaff
              ? (iso) => <StaffPicker team={team} available={freeAt(iso)} value={effectiveStaff(iso)} onChange={setStaffChoice} />
              : undefined
          }
        />
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
