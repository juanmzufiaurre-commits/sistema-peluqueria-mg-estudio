"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveWorkingHoursAction } from "@/actions/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormMessage } from "./ui";

export interface HourRange {
  weekday: number;
  start: string;
  end: string;
}

const DAYS = [
  { n: 1, label: "Lunes" },
  { n: 2, label: "Martes" },
  { n: 3, label: "Miércoles" },
  { n: 4, label: "Jueves" },
  { n: 5, label: "Viernes" },
  { n: 6, label: "Sábado" },
  { n: 0, label: "Domingo" },
];

export function HoursEditor({ initial }: { initial: HourRange[] }) {
  const [ranges, setRanges] = useState<HourRange[]>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (index: number, patch: Partial<HourRange>) => setRanges((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  // Día cerrado: abre de 10 a 20. Si ya tiene horario, el nuevo arranca a la tarde (pausa del mediodía).
  const addRange = (weekday: number) =>
    setRanges((rs) => [...rs, rs.some((r) => r.weekday === weekday) ? { weekday, start: "15:00", end: "20:00" } : { weekday, start: "10:00", end: "20:00" }]);

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await saveWorkingHoursAction({ ranges });
      setMsg(r.success ? { ok: true, text: "Horarios guardados." } : { ok: false, text: r.error });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-ink/5">
        {DAYS.map((d) => {
          const dayRanges = ranges.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === d.n);
          return (
            <li key={d.n} className="flex flex-wrap items-start gap-x-4 gap-y-2 py-3">
              <span className="flex w-28 items-center gap-2 pt-2 font-medium">
                <span aria-hidden className={cn("size-1.5 rounded-full", dayRanges.length ? "bg-st-confirmed" : "bg-muted/50")} />
                {d.label}
              </span>
              <div className="flex flex-1 flex-col gap-2">
                {dayRanges.length === 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-muted">Cerrado</span>
                    <AddRangeButton label="Abrir este día" onClick={() => addRange(d.n)} />
                  </div>
                )}
                {dayRanges.map(({ r, i }) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                    <span className="hidden w-6 text-xs text-muted sm:inline">de</span>
                    <input
                      type="time"
                      aria-label={`${d.label}: apertura`}
                      value={r.start}
                      onChange={(e) => update(i, { start: e.target.value })}
                      className="h-10 rounded-sm border border-ink/10 bg-ink/[0.03] px-1.5 text-sm tabular-nums focus-visible:border-ink sm:px-2 sm:text-base"
                    />
                    <span className="text-xs text-muted">a</span>
                    <input
                      type="time"
                      aria-label={`${d.label}: cierre`}
                      value={r.end}
                      onChange={(e) => update(i, { end: e.target.value })}
                      className="h-10 rounded-sm border border-ink/10 bg-ink/[0.03] px-1.5 text-sm tabular-nums focus-visible:border-ink sm:px-2 sm:text-base"
                    />
                    <button
                      type="button"
                      aria-label={`Quitar este horario del ${d.label}`}
                      title="Quitar este horario"
                      onClick={() => setRanges((rs) => rs.filter((_, k) => k !== i))}
                      className="flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-st-cancelled/10 hover:text-st-cancelled"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                {dayRanges.length > 0 && <AddRangeButton label="Agregar otro horario" onClick={() => addRange(d.n)} />}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted">¿Cortás al mediodía? Usá “Agregar otro horario” en ese día (ej. de 10:00 a 13:00 y de 15:00 a 20:00).</p>
      <FormMessage msg={msg} />
      <Button className="self-start" onClick={save} disabled={pending}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar horarios
      </Button>
    </div>
  );
}

function AddRangeButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 w-fit items-center gap-2 rounded-sm border border-dashed border-ink/25 px-3.5 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
    >
      <Plus aria-hidden className="size-4" /> {label}
    </button>
  );
}
