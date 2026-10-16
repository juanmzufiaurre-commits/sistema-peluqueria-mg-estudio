"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/actions/config";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export interface SettingsValues {
  businessName: string;
  address: string;
  whatsappNumber: string;
  bufferMinutes: number;
  slotStepMinutes: number;
  bookingWindowDays: number;
  sameDayCutoffTime: string;
  minCancelHours: number;
}

const STEPS = [5, 10, 15, 20, 30, 45, 60];

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setMsg(null);
    startTransition(async () => {
      const r = await saveSettingsAction(Object.fromEntries(fd.entries()));
      setMsg(r.success ? { ok: true, text: "Ajustes guardados." } : { ok: false, text: r.error });
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre del local" htmlFor="businessName">
          <Input id="businessName" name="businessName" defaultValue={initial.businessName} required />
        </Field>
        <Field label="WhatsApp del local" htmlFor="whatsappNumber" hint="Para que el cliente te escriba si ya no puede cancelar online">
          <Input id="whatsappNumber" name="whatsappNumber" type="tel" defaultValue={initial.whatsappNumber} placeholder="11 2345 6789" />
        </Field>
      </div>
      <Field label="Dirección" htmlFor="address">
        <Input id="address" name="address" defaultValue={initial.address} placeholder="Calle 123, Ciudad" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Margen entre turnos (min)" htmlFor="bufferMinutes" hint="Se suma al final de cada turno">
          <Input id="bufferMinutes" name="bufferMinutes" type="number" min={0} max={120} defaultValue={initial.bufferMinutes} required />
        </Field>
        <Field label="Grilla de horarios" htmlFor="slotStepMinutes" hint="Cada cuántos minutos se ofrece un horario">
          <select id="slotStepMinutes" name="slotStepMinutes" defaultValue={initial.slotStepMinutes} className="h-12 w-full rounded-sm border border-line bg-white/60 px-4">
            {STEPS.map((s) => (
              <option key={s} value={s}>
                Cada {s} min
              </option>
            ))}
          </select>
        </Field>
        <Field label="Días reservables" htmlFor="bookingWindowDays" hint="Incluye el día de hoy">
          <Input id="bookingWindowDays" name="bookingWindowDays" type="number" min={1} max={60} defaultValue={initial.bookingWindowDays} required />
        </Field>
        <Field label="Hora de corte del día" htmlFor="sameDayCutoffTime" hint="Pasada esta hora no se reserva para hoy">
          <Input id="sameDayCutoffTime" name="sameDayCutoffTime" type="time" defaultValue={initial.sameDayCutoffTime} required />
        </Field>
        <Field label="Cancelación hasta (horas antes)" htmlFor="minCancelHours" hint="Ventana mínima para cancelar o cambiar online">
          <Input id="minCancelHours" name="minCancelHours" type="number" min={0} max={72} defaultValue={initial.minCancelHours} required />
        </Field>
      </div>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-st-confirmed" : "text-st-cancelled"}>
          {msg.text}
        </p>
      )}
      <Button type="submit" className="self-start" disabled={pending}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar ajustes
      </Button>
    </form>
  );
}
