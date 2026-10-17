"use client";

import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import type { AvailableDay } from "@/actions/availability";
import { cancelMyBookingAction, getRescheduleAvailabilityAction, rescheduleMyBookingAction } from "@/actions/my-booking";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";
import { ACTIVE, STATUS_LABEL, type BookingStatusValue } from "@/lib/booking-status";
import { formatArs, formatDuration, formatLongDate, formatTime } from "@/lib/format";
import { toWaMeNumber } from "@/lib/phone";
import type { PublicInfo } from "@/server/services/catalog";
import { StepDateTime, StepDateTimeSkeleton } from "./step-datetime";

interface Props {
  token: string;
  info: PublicInfo;
  booking: {
    publicCode: string;
    status: BookingStatusValue;
    serviceName: string;
    firstName: string;
    startsAt: string;
    durationMinutes: number;
    priceArs: number;
    canModify: boolean;
    minCancelHours: number;
  };
}

type Mode = "view" | "pick" | "confirm" | "cancelled";

export function MyBooking({ token, info, booking }: Props) {
  const [startsAt, setStartsAt] = useState(booking.startsAt);
  const [status, setStatus] = useState(booking.status);
  const [mode, setMode] = useState<Mode>(status === "CANCELLED_BY_CLIENT" ? "cancelled" : "view");
  const [availability, setAvailability] = useState<Promise<ActionResult<AvailableDay[]>> | null>(null);
  const [newSlot, setNewSlot] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = (ACTIVE as readonly string[]).includes(status);
  const canModify = booking.canModify && active;
  const wa = info.whatsappNumber ? `https://wa.me/${toWaMeNumber(info.whatsappNumber)}` : null;

  function loadSlots() {
    setAvailability(getRescheduleAvailabilityAction(token));
  }

  function confirmMove() {
    if (!newSlot) return;
    setError(null);
    startTransition(async () => {
      const r = await rescheduleMyBookingAction({ token, startsAt: newSlot });
      if (r.success && r.data) {
        setStartsAt(r.data.startsAt);
        setNotice("¡Listo! Tu turno fue reprogramado.");
        setMode("view");
      } else if (!r.success) {
        setError(r.error);
      }
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      const r = await cancelMyBookingAction(token);
      if (r.success) {
        setStatus("CANCELLED_BY_CLIENT");
        setCancelOpen(false);
        setMode("cancelled");
      } else setError(r.error);
    });
  }

  if (mode === "cancelled") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-[1.85rem] font-medium leading-tight tracking-tight">Turno cancelado</h1>
        <p className="text-ink-soft">Liberamos tu horario. ¡Gracias por avisar!</p>
        <Link href="/#reservar" className="mt-2 inline-flex h-12 items-center rounded-sm bg-ink px-6 text-sm uppercase tracking-[0.12em] text-cream">
          Reservar otro turno
        </Link>
      </div>
    );
  }

  if (mode === "pick" || mode === "confirm") {
    return (
      <div>
        <button
          type="button"
          onClick={() => (mode === "confirm" ? setMode("pick") : setMode("view"))}
          className="mb-4 -ml-2 flex items-center gap-2 p-2 text-sm"
        >
          <ArrowLeft aria-hidden className="size-4" /> Volver
        </button>

        {mode === "pick" && availability && (
          <>
            <h1 className="mb-6 text-[1.85rem] font-medium leading-tight tracking-tight">Elegí el nuevo horario</h1>
            <Suspense fallback={<StepDateTimeSkeleton />}>
              <StepDateTime
                availability={availability}
                onRetry={loadSlots}
                onSelect={(iso) => {
                  setNewSlot(iso);
                  setMode("confirm");
                }}
              />
            </Suspense>
          </>
        )}

        {mode === "confirm" && newSlot && (
          <div className="flex flex-col gap-6">
            <h1 className="text-[1.85rem] font-medium leading-tight tracking-tight">Confirmá el cambio</h1>
            <div className="rounded-sm border border-line bg-surface p-5 text-sm">
              <p className="text-muted line-through">
                {formatLongDate(startsAt)} · {formatTime(startsAt)} hs
              </p>
              <p className="mt-2 text-xl font-medium">
                {formatLongDate(newSlot)} · {formatTime(newSlot)} hs
              </p>
            </div>
            {error && (
              <p role="alert" className="text-st-cancelled">
                {error}
              </p>
            )}
            <Button size="lg" onClick={confirmMove} disabled={pending}>
              {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Confirmar nuevo horario
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-[1.85rem] font-medium leading-tight tracking-tight">Hola, {booking.firstName}</h1>
        <p className="mt-2 text-ink-soft">Este es tu turno en {info.businessName}.</p>
      </div>

      {notice && (
        <p role="status" className="rounded-sm bg-st-confirmed/10 p-4 text-center text-st-confirmed">
          {notice}
        </p>
      )}

      <section className="rounded-sm border border-ink bg-surface">
        <div className="border-b border-dashed border-ink/40 p-5 text-center">
          <p className="label-wide text-muted">{active ? "Tu turno" : STATUS_LABEL[status]}</p>
          <p className="mt-2 text-2xl font-medium tracking-tight">{formatLongDate(startsAt)}</p>
          <p className="text-4xl font-light tabular-nums tracking-tight">{formatTime(startsAt)} hs</p>
        </div>
        <dl className="flex flex-col gap-3 p-5 text-sm">
          <Row label="Servicio" value={booking.serviceName} />
          <Row label="Duración" value={formatDuration(booking.durationMinutes)} />
          <Row label="Total" value={formatArs(booking.priceArs)} />
          {info.address && <Row label="Lugar" value={info.address} />}
          <Row label="Código" value={booking.publicCode} />
        </dl>
      </section>

      {canModify ? (
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => {
              setError(null);
              setNotice(null);
              loadSlots();
              setMode("pick");
            }}
          >
            Cambiar horario
          </Button>
          <Button variant="outline" size="lg" onClick={() => setCancelOpen(true)}>
            Cancelar turno
          </Button>
        </div>
      ) : (
        <div className="rounded-sm bg-cream-deep p-5 text-sm">
          {active ? (
            <p>
              Ya no se puede cancelar ni cambiar online (hasta {booking.minCancelHours} h antes del turno). Si no podés venir, escribinos para coordinar.
            </p>
          ) : (
            <p>Este turno ya no está activo.</p>
          )}
          {wa && active && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 underline underline-offset-4">
              <MessageCircle aria-hidden className="size-4" /> Escribir por WhatsApp
            </a>
          )}
        </div>
      )}

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} title="¿Cancelar tu turno?">
        <div className="flex flex-col gap-5">
          <p>
            Vamos a liberar el horario del {formatLongDate(startsAt)} a las {formatTime(startsAt)} hs. Si querés, podés reservar otro después.
          </p>
          {error && (
            <p role="alert" className="text-st-cancelled">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setCancelOpen(false)} disabled={pending}>
              Volver
            </Button>
            <Button className="flex-1 bg-st-cancelled hover:bg-st-cancelled/90" onClick={cancel} disabled={pending}>
              {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Sí, cancelar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
