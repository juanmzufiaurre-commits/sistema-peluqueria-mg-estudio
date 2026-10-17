"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createBlockAction, deleteBlockAction } from "@/actions/config";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export interface BlockRow {
  id: string;
  label: string; // ya formateado en el servidor
  reason: string | null;
}

export function BlocksManager({ blocks }: { blocks: BlockRow[] }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function create(fd: FormData) {
    setMsg(null);
    startTransition(async () => {
      const r = await createBlockAction(Object.fromEntries(fd.entries()));
      if (!r.success) return setMsg({ ok: false, text: r.error });
      const n = r.data?.affectedBookings ?? 0;
      setFormKey((k) => k + 1);
      setMsg({
        ok: true,
        text: n > 0 ? `Bloqueo creado. Ojo: ${n} ${n === 1 ? "turno ya agendado cae" : "turnos ya agendados caen"} en ese período; reprogramalos o cancelalos desde la agenda.` : "Bloqueo creado.",
      });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteBlockAction(id);
      if (!r.success) setMsg({ ok: false, text: r.error });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form key={formKey} action={create} className="flex flex-col gap-4 rounded-sm border border-line bg-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Desde" htmlFor="startDate">
            <Input id="startDate" name="startDate" type="date" required />
          </Field>
          <Field label="Hasta" htmlFor="endDate">
            <Input id="endDate" name="endDate" type="date" required />
          </Field>
          <Field label="Hora de inicio" htmlFor="startTime" hint="Vacío = día completo">
            <Input id="startTime" name="startTime" type="time" />
          </Field>
          <Field label="Hora de fin" htmlFor="endTime">
            <Input id="endTime" name="endTime" type="time" />
          </Field>
        </div>
        <Field label="Motivo" htmlFor="reason">
          <Input id="reason" name="reason" placeholder="Feriado, vacaciones, trámite…" maxLength={120} />
        </Field>
        <Button type="submit" className="self-start" disabled={pending}>
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Agregar bloqueo
        </Button>
      </form>

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-st-confirmed" : "text-st-cancelled"}>
          {msg.text}
        </p>
      )}

      {blocks.length === 0 ? (
        <p className="text-sm text-muted">No hay bloqueos próximos.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-4 rounded-sm border border-line bg-surface p-3">
              <span>
                <span className="block">{b.label}</span>
                {b.reason && <span className="block text-sm text-muted">{b.reason}</span>}
              </span>
              <button type="button" onClick={() => remove(b.id)} disabled={pending} aria-label={`Quitar bloqueo ${b.label}`} className="flex size-10 items-center justify-center hover:bg-cream-deep">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
