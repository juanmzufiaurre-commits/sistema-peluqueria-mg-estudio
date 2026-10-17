"use client";

import { ChevronDown, Loader2, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { addClientNoteAction, cancelBookingByAdminAction, setBookingStatusAction } from "@/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import { ACTIVE, BOOKING_STATUSES, STATUS_CLASS, STATUS_LABEL, isCancelled, type BookingStatusValue } from "@/lib/booking-status";
import { formatArs, formatDuration, formatLongDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WA_TEMPLATE_LABEL, waLink, waMessage, type WaContext, type WaTemplate } from "@/lib/wa-links";
import type { AgendaBooking } from "@/types/admin";
import { PhotoGallery } from "./photo-gallery";
import { RescheduleDialog } from "./reschedule-dialog";
import { ResultPhotos } from "./result-photos";

interface Props {
  bookings: AgendaBooking[];
  businessName: string;
  address: string | null;
  rebookUrl: string;
}

const OPERATIVE = BOOKING_STATUSES.filter((s) => !isCancelled(s));

export function BookingTimeline({ bookings, businessName, address, rebookUrl }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (bookings.length === 0) {
    return <p className="rounded-sm border border-dashed border-line p-8 text-center text-muted">No hay turnos para este día.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {bookings.map((b) => (
        <li key={b.id}>
          <BookingCard
            booking={b}
            expanded={openId === b.id}
            onToggle={() => setOpenId((cur) => (cur === b.id ? null : b.id))}
            ctx={{
              firstName: b.client.firstName,
              dateLabel: formatLongDate(b.startsAt),
              timeLabel: formatTime(b.startsAt),
              serviceName: b.serviceName,
              businessName,
              address,
              rebookUrl,
            }}
          />
        </li>
      ))}
    </ol>
  );
}

function BookingCard({ booking: b, expanded, onToggle, ctx }: { booking: AgendaBooking; expanded: boolean; onToggle: () => void; ctx: WaContext }) {
  const cancelled = isCancelled(b.status);
  const panelId = `booking-${b.id}`;

  return (
    <article className={cn("rounded-sm border bg-surface", expanded ? "border-ink" : "border-line", cancelled && "opacity-70")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <span className="w-14 shrink-0 font-display text-2xl leading-none">{formatTime(b.startsAt)}</span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate font-medium", cancelled && "line-through")}>
            {b.client.firstName} {b.client.lastName}
          </span>
          <span className="block truncate text-sm text-ink-soft">{b.serviceName}</span>
        </span>
        <StatusBadge status={b.status} />
        <ChevronDown aria-hidden className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div id={panelId} className="flex flex-col gap-6 border-t border-line p-4">
          <Details b={b} />
          <Section title="Fotos de referencia">
            <PhotoGallery photos={b.photos.filter((p) => p.kind === "REFERENCE")} />
          </Section>
          <Section title="Fotos del resultado">
            <ResultPhotos booking={b} />
          </Section>
          <WhatsAppActions b={b} ctx={ctx} />
          <ClientCrm b={b} />
          <Actions b={b} ctx={ctx} />
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: BookingStatusValue }) {
  return <span className={cn("shrink-0 rounded-sm px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em]", STATUS_CLASS[status])}>{STATUS_LABEL[status]}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="label-wide mb-3 text-ink-soft">{title}</h3>
      {children}
    </section>
  );
}

function Details({ b }: { b: AgendaBooking }) {
  const end = new Date(new Date(b.startsAt).getTime() + b.durationMinutes * 60_000).toISOString();
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
      <Item label="Horario" value={`${formatTime(b.startsAt)} – ${formatTime(end)} hs`} />
      <Item label="Duración" value={formatDuration(b.durationMinutes)} />
      <Item label="Precio" value={formatArs(b.priceArs)} />
      <Item label="Profesional" value={b.staffName} />
      <Item label="WhatsApp" value={<a className="underline underline-offset-4" href={waLink(b.client.phoneE164, "")} target="_blank" rel="noopener noreferrer">{b.client.phoneE164}</a>} />
      <Item label="Código" value={b.publicCode} />
    </dl>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function WhatsAppActions({ b, ctx }: { b: AgendaBooking; ctx: WaContext }) {
  const templates: WaTemplate[] = ["confirmation", "reminder", "reschedule"];
  return (
    <Section title="Avisar por WhatsApp">
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <a
            key={t}
            href={waLink(b.client.phoneE164, waMessage(t, ctx))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink px-3 text-xs uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-cream"
          >
            <MessageCircle aria-hidden className="size-4" /> {WA_TEMPLATE_LABEL[t]}
          </a>
        ))}
      </div>
    </Section>
  );
}

function ClientCrm({ b }: { b: AgendaBooking }) {
  const c = b.client;
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addNote() {
    setError(null);
    startTransition(async () => {
      const r = await addClientNoteAction({ clientId: c.id, bookingId: b.id, body });
      if (r.success) setBody("");
      else setError(r.error);
    });
  }

  return (
    <Section title="Ficha del cliente">
      <p className="text-sm text-ink-soft">
        {c.visits} {c.visits === 1 ? "visita" : "visitas"} · {c.noShows} {c.noShows === 1 ? "ausencia" : "ausencias"}
        {c.favoriteService ? ` · Habitual: ${c.favoriteService}` : ""}
      </p>

      {c.history.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {c.history.map((h) => (
            <li key={h.bookingId} className="flex items-center justify-between gap-3">
              <span>
                {formatLongDate(h.startsAt)} · {h.serviceName}
              </span>
              <StatusBadge status={h.status} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <p className="text-sm font-medium">Notas técnicas</p>
        {c.notes.length === 0 && <p className="text-sm text-muted">Sin notas todavía.</p>}
        <ul className="flex flex-col gap-2">
          {c.notes.map((n) => (
            <li key={n.id} className="rounded-sm bg-cream-deep p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-xs text-muted">{formatLongDate(n.createdAt)}</p>
            </li>
          ))}
        </ul>
        <label htmlFor={`note-${b.id}`} className="sr-only">
          Nueva nota
        </label>
        <textarea
          id={`note-${b.id}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Máquina nº 2 a los costados, tijera arriba, producto usado…"
          className="w-full rounded-sm border border-line bg-surface p-3 text-sm placeholder:text-muted/70 focus-visible:border-ink"
        />
        {error && (
          <p role="alert" className="text-sm text-st-cancelled">
            {error}
          </p>
        )}
        <Button variant="outline" size="sm" className="self-start" disabled={pending || body.trim() === ""} onClick={addNote}>
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar nota
        </Button>
      </div>
    </Section>
  );
}

function Actions({ b, ctx }: { b: AgendaBooking; ctx: WaContext }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelledNow, setCancelledNow] = useState(false);
  const [autoSent, setAutoSent] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const isActive = (ACTIVE as readonly string[]).includes(b.status);
  const cancelled = isCancelled(b.status);

  function changeStatus(status: BookingStatusValue) {
    setError(null);
    startTransition(async () => {
      const r = await setBookingStatusAction({ bookingId: b.id, status });
      if (!r.success) setError(r.error);
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      const r = await cancelBookingByAdminAction(b.id);
      if (r.success) {
        setAutoSent(r.data?.autoSent ?? false);
        setCancelledNow(true);
      } else setError(r.error);
    });
  }

  return (
    <Section title="Gestión del turno">
      <div className="flex flex-col gap-4">
        {!cancelled && (
          <div className="flex items-center gap-3">
            <label htmlFor={`status-${b.id}`} className="text-sm text-muted">
              Estado
            </label>
            <Select
              id={`status-${b.id}`}
              value={b.status}
              disabled={pending}
              onChange={(e) => changeStatus(e.target.value as BookingStatusValue)}
              className="h-10 w-auto px-3 text-sm"
            >
              {OPERATIVE.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-st-cancelled">
            {error}
          </p>
        )}

        {isActive && (
          <Button variant="outline" size="sm" className="self-start" onClick={() => setMoveOpen(true)}>
            Reprogramar
          </Button>
        )}
        {isActive && (
          <Button variant="outline" size="sm" className="self-start border-st-cancelled text-st-cancelled hover:bg-st-cancelled hover:text-cream" onClick={() => setConfirmOpen(true)}>
            Cancelar turno
          </Button>
        )}
        {cancelled && (
          <p className="text-sm text-muted">
            Turno cancelado: el horario quedó libre.{" "}
            <a className="underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={waLink(b.client.phoneE164, waMessage("cancellation", ctx))}>
              Avisar al cliente por WhatsApp
            </a>
          </p>
        )}
      </div>

      <RescheduleDialog booking={b} ctx={ctx} open={moveOpen} onClose={() => setMoveOpen(false)} />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Cancelar turno">
        {cancelledNow ? (
          <div className="flex flex-col gap-4">
            {autoSent ? (
              <p>El turno se canceló, el horario quedó libre y <strong>le avisamos al cliente por WhatsApp</strong>.</p>
            ) : (
              <>
                <p>El turno se canceló y el horario quedó libre. Avisale al cliente:</p>
                <a
                  href={waLink(b.client.phoneE164, waMessage("cancellation", ctx))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-ink px-6 text-sm uppercase tracking-[0.12em] text-cream"
                >
                  <MessageCircle aria-hidden className="size-4" /> Avisar por WhatsApp
                </a>
              </>
            )}
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <p>
              Vas a cancelar el turno de <strong>{b.client.firstName} {b.client.lastName}</strong> del {ctx.dateLabel} a las {ctx.timeLabel} hs. El horario va a quedar libre para nuevas reservas.
            </p>
            {error && (
              <p role="alert" className="text-sm text-st-cancelled">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmOpen(false)} disabled={pending}>
                Volver
              </Button>
              <Button className="flex-1 bg-st-cancelled hover:bg-st-cancelled/90" onClick={cancel} disabled={pending}>
                {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Sí, cancelar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </Section>
  );
}
