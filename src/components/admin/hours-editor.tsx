"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveWorkingHoursAction } from "@/actions/config";
import { Button } from "@/components/ui/button";

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

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await saveWorkingHoursAction({ ranges });
      setMsg(r.success ? { ok: true, text: "Horarios guardados." } : { ok: false, text: r.error });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {DAYS.map((d) => {
          const dayRanges = ranges.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === d.n);
          return (
            <li key={d.n} className="flex flex-wrap items-start gap-x-4 gap-y-2 rounded-sm border border-line bg-white/50 p-4">
              <span className="w-24 pt-2 font-medium">{d.label}</span>
              <div className="flex flex-1 flex-col gap-2">
                {dayRanges.length === 0 && <span className="pt-2 text-sm text-muted">Cerrado</span>}
                {dayRanges.map(({ r, i }) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      aria-label={`${d.label}: apertura`}
                      value={r.start}
                      onChange={(e) => update(i, { start: e.target.value })}
                      className="h-10 rounded-sm border border-line bg-white/60 px-2"
                    />
                    <span aria-hidden>–</span>
                    <input
                      type="time"
                      aria-label={`${d.label}: cierre`}
                      value={r.end}
                      onChange={(e) => update(i, { end: e.target.value })}
                      className="h-10 rounded-sm border border-line bg-white/60 px-2"
                    />
                    <button type="button" aria-label={`Quitar tramo del ${d.label}`} onClick={() => setRanges((rs) => rs.filter((_, k) => k !== i))} className="flex size-10 items-center justify-center hover:bg-cream-deep">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRanges((rs) => [...rs, { weekday: d.n, start: "10:00", end: "20:00" }])}>
                <Plus aria-hidden className="size-4" /> Tramo
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted">Para una pausa al mediodía, agregá dos tramos (ej. 10:00–13:00 y 15:00–20:00).</p>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-st-confirmed" : "text-st-cancelled"}>
          {msg.text}
        </p>
      )}
      <Button className="self-start" onClick={save} disabled={pending}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar horarios
      </Button>
    </div>
  );
}
