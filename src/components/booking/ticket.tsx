"use client";

import { CalendarPlus, Check, Copy, Download } from "lucide-react";
import { useMemo, useState } from "react";
import type { BookingReceipt } from "@/actions/bookings";
import { ButtonLink, Button } from "@/components/ui/button";
import { buildIcs, googleCalendarUrl, type CalendarEvent } from "@/lib/ics";
import { formatArs, formatDuration, formatLongDate, formatTime } from "@/lib/format";

interface Props {
  receipt: BookingReceipt;
  businessName: string;
  address: string | null;
  onNewBooking: () => void;
}

export function Ticket({ receipt, businessName, address, onNewBooking }: Props) {
  const [copied, setCopied] = useState(false);

  const event: CalendarEvent = useMemo(() => {
    const start = new Date(receipt.startsAt);
    return {
      uid: receipt.publicCode,
      title: `${receipt.serviceName} — ${businessName}`,
      description: `Turno ${receipt.publicCode}`,
      location: address ?? undefined,
      start,
      end: new Date(start.getTime() + receipt.durationMinutes * 60_000),
    };
  }, [receipt, businessName, address]);

  const icsHref = useMemo(() => `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs(event))}`, [event]);
  const cancelUrl = `${window.location.origin}/turno/${receipt.cancelToken}`;

  async function copyCancelLink() {
    try {
      await navigator.clipboard.writeText(cancelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace igual queda visible para copiarlo a mano.
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-ink text-cream">
          <Check aria-hidden className="size-6" />
        </span>
        <h2 className="font-display text-3xl font-semibold">¡Turno confirmado!</h2>
        <p className="text-ink-soft">Te esperamos en {businessName}.</p>
      </div>

      <section aria-label="Comprobante" className="rounded-sm border border-ink bg-white/60">
        <div className="border-b border-dashed border-ink/40 p-5 text-center">
          <p className="label-wide text-muted">Código de turno</p>
          <p className="mt-2 font-display text-3xl tracking-[0.15em]">{receipt.publicCode}</p>
        </div>
        <dl className="flex flex-col gap-3 p-5 text-sm">
          <Row label="Servicio" value={receipt.serviceName} />
          <Row label="Día" value={formatLongDate(receipt.startsAt)} />
          <Row label="Hora" value={`${formatTime(receipt.startsAt)} hs`} />
          <Row label="Duración" value={formatDuration(receipt.durationMinutes)} />
          {address && <Row label="Lugar" value={address} />}
          <Row label="Total" value={<span className="font-display text-lg">{formatArs(receipt.priceArs)}</span>} />
        </dl>
      </section>

      <div className="flex flex-col gap-3">
        <ButtonLink href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" variant="outline">
          <CalendarPlus aria-hidden className="size-4" /> Agregar a Google Calendar
        </ButtonLink>
        <ButtonLink href={icsHref} download={`turno-${receipt.publicCode}.ics`} variant="ghost">
          <Download aria-hidden className="size-4" /> Descargar .ics
        </ButtonLink>
      </div>

      <section className="rounded-sm bg-cream-deep p-5">
        <p className="label-wide text-ink-soft">¿No podés venir?</p>
        <p className="mt-2 text-sm text-ink-soft">Guardá este enlace: con él podés cancelar o pedir otro horario. No lo vamos a volver a mostrar.</p>
        <p className="mt-3 break-all rounded-sm bg-cream px-3 py-2 text-xs">{cancelUrl}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={copyCancelLink}>
          <Copy aria-hidden className="size-4" /> {copied ? "¡Copiado!" : "Copiar enlace"}
        </Button>
      </section>

      <Button variant="ghost" onClick={onNewBooking}>
        Reservar otro turno
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
