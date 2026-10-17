"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { getAdminSlotsAction, rescheduleBookingByAdminAction } from "@/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { APP_TIMEZONE, localDateString } from "@/lib/dates";
import { formatLongDate, formatTime } from "@/lib/format";
import { waLink, waMessage, type WaContext } from "@/lib/wa-links";
import type { AgendaBooking } from "@/types/admin";

export function RescheduleDialog({ booking: b, ctx, open, onClose }: { booking: AgendaBooking; ctx: WaContext; open: boolean; onClose: () => void }) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [movedTo, setMovedTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pickDate(value: string) {
    setDate(value);
    setChosen(null);
    setSlots(null);
    setError(null);
    if (!value) return;
    startTransition(async () => {
      const r = await getAdminSlotsAction({ bookingId: b.id, date: value });
      if (r.success) setSlots(r.data ?? []);
      else setError(r.error);
    });
  }

  function confirm() {
    if (!chosen) return;
    setError(null);
    startTransition(async () => {
      const r = await rescheduleBookingByAdminAction({ bookingId: b.id, startsAt: chosen });
      if (r.success && r.data) setMovedTo(r.data.startsAt);
      else if (!r.success) setError(r.error);
    });
  }

  function close() {
    onClose();
    setTimeout(() => {
      setDate("");
      setSlots(null);
      setChosen(null);
      setMovedTo(null);
      setError(null);
    }, 200);
  }

  return (
    <Dialog open={open} onClose={close} title="Reprogramar turno">
      {movedTo ? (
        <div className="flex flex-col gap-4">
          <p>
            Turno movido al <strong>{formatLongDate(movedTo)}</strong> a las <strong>{formatTime(movedTo)} hs</strong>. Avisale al cliente:
          </p>
          <a
            href={waLink(b.client.phoneE164, waMessage("moved", { ...ctx, dateLabel: formatLongDate(movedTo), timeLabel: formatTime(movedTo) }))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-ink px-6 text-sm uppercase tracking-[0.12em] text-cream"
          >
            <MessageCircle aria-hidden className="size-4" /> Avisar por WhatsApp
          </a>
          <Button variant="ghost" onClick={close}>
            Cerrar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-soft">
            Ahora: {formatLongDate(b.startsAt)} · {formatTime(b.startsAt)} hs. Elegí el nuevo día; el horario propio del turno cuenta como libre.
          </p>
          <div>
            <label htmlFor={`rs-date-${b.id}`} className="label-wide mb-2 block text-ink-soft">
              Nuevo día
            </label>
            <Input id={`rs-date-${b.id}`} type="date" value={date} min={localDateString(new Date(), APP_TIMEZONE)} onChange={(e) => pickDate(e.target.value)} />
          </div>

          {pending && !slots && <Loader2 aria-label="Cargando horarios" className="size-5 animate-spin" />}
          {slots && slots.length === 0 && <p className="text-sm text-muted">No hay horarios libres ese día (¿día no laborable o ya completo?).</p>}
          {slots && slots.length > 0 && (
            <ul className="grid grid-cols-4 gap-2">
              {slots.map((iso) => (
                <li key={iso}>
                  <button
                    type="button"
                    onClick={() => setChosen(iso)}
                    aria-pressed={chosen === iso}
                    className={`h-10 w-full rounded-sm border text-sm transition-colors ${chosen === iso ? "border-ink bg-ink text-cream" : "border-line bg-surface hover:border-ink"}`}
                  >
                    {formatTime(iso)}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p role="alert" className="text-sm text-st-cancelled">
              {error}
            </p>
          )}
          <Button size="lg" disabled={!chosen || pending} onClick={confirm}>
            {pending && slots && <Loader2 aria-hidden className="size-4 animate-spin" />} Mover turno
          </Button>
        </div>
      )}
    </Dialog>
  );
}
