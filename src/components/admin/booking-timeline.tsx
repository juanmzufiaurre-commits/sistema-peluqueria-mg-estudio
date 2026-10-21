"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarX2,
  ChevronDown,
  Clock,
  Hash,
  ImageIcon,
  Loader2,
  MessageCircle,
  NotebookPen,
  Phone,
  Sparkles,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { addClientNoteAction, cancelBookingByAdminAction, setBookingStatusAction } from "@/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Price } from "@/components/ui/price";
import { ACTIVE, BOOKING_STATUSES, STATUS_CLASS, STATUS_DOT, STATUS_LABEL, isCancelled, type BookingStatusValue } from "@/lib/booking-status";
import { formatDuration, formatLongDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WA_TEMPLATE_LABEL, waLink, waMessage, type WaContext, type WaTemplate } from "@/lib/wa-links";
import type { AgendaBooking } from "@/types/admin";
import { PhotoGallery } from "./photo-gallery";
import { RescheduleDialog } from "./reschedule-dialog";
import { ResultPhotos } from "./result-photos";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "./ui";

interface Props {
  bookings: AgendaBooking[];
  businessName: string;
  address: string | null;
  rebookUrl: string;
}

const OPERATIVE = BOOKING_STATUSES.filter((s) => !isCancelled(s));

const endOf = (b: AgendaBooking) => new Date(new Date(b.startsAt).getTime() + b.durationMinutes * 60_000).toISOString();

export function BookingTimeline({ bookings, businessName, address, rebookUrl }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (bookings.length === 0) {
    return <EmptyState icon={CalendarX2} title="No hay turnos para este día" text="Cuando alguien reserve, el turno aparece acá al instante." />;
  }

  const active = bookings.filter((b) => !isCancelled(b.status)).length;

  return (
    <div>
      <p className="label-wide mb-4 text-muted">
        {active} {active === 1 ? "turno" : "turnos"}
        {bookings.length > active && ` · ${bookings.length - active} ${bookings.length - active === 1 ? "cancelado" : "cancelados"}`}
      </p>
      {/* Línea de tiempo: hora a la izquierda, tarjeta a la derecha */}
      <ol className="relative flex flex-col gap-3 before:absolute before:bottom-4 before:left-[3.75rem] before:top-4 before:w-px before:bg-ink/10 sm:before:left-[4.75rem]">
        {bookings.map((b) => (
          <li key={b.id} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4 sm:grid-cols-[4.25rem_minmax(0,1fr)]">
            <div className="relative pt-4 text-right">
              <span className={cn("block text-lg font-light leading-none tabular-nums sm:text-xl", isCancelled(b.status) && "text-muted line-through")}>{formatTime(b.startsAt)}</span>
              <span className="mt-1 block text-[0.7rem] tabular-nums text-muted">{formatTime(endOf(b))}</span>
              <span aria-hidden className={cn("absolute -right-[0.8125rem] top-[1.3rem] size-2.5 rounded-full ring-4 ring-cream", STATUS_DOT[b.status])} />
            </div>
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
    </div>
  );
}

function BookingCard({ booking: b, expanded, onToggle, ctx }: { booking: AgendaBooking; expanded: boolean; onToggle: () => void; ctx: WaContext }) {
  const cancelled = isCancelled(b.status);
  const panelId = `booking-${b.id}`;
  const reduceMotion = useReducedMotion();
  const refs = b.photos.filter((p) => p.kind === "REFERENCE").length;

  return (
    <article className={cn("surface-card relative overflow-hidden transition-colors", expanded && "!border-ink/35", cancelled && "opacity-60")}>
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-0.5", STATUS_DOT[b.status])} />
      <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={panelId} className="flex w-full items-center gap-3 p-4 pl-5 text-left">
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate font-medium", cancelled && "line-through")}>
            {b.client.firstName} {b.client.lastName}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            {/* En celular el estado va abajo del nombre para no cortarlo */}
            <span className="w-full sm:hidden">
              <StatusBadge status={b.status} />
            </span>
            <span className="truncate">{b.serviceName}</span>
            <span className="inline-flex items-center gap-1 text-muted">
              <UserRound aria-hidden className="size-3.5" /> {b.staffName}
            </span>
            {refs > 0 && (
              <span className="inline-flex items-center gap-1 text-muted">
                <ImageIcon aria-hidden className="size-3.5" /> {refs}
              </span>
            )}
          </span>
        </span>
        <span className="hidden sm:inline-flex">
          <StatusBadge status={b.status} />
        </span>
        <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-muted transition-transform duration-300", expanded && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-7 border-t border-ink/10 p-4 pl-5 sm:p-5 sm:pl-6">
              <Details b={b} />
              {!cancelled && <StatusPicker b={b} />}
              <WhatsAppActions b={b} ctx={ctx} />
              <Section icon={ImageIcon} title="Fotos de referencia">
                <PhotoGallery photos={b.photos.filter((p) => p.kind === "REFERENCE")} />
              </Section>
              <Section icon={Sparkles} title="Fotos del resultado">
                <ResultPhotos booking={b} />
              </Section>
              <ClientCrm b={b} />
              <Actions b={b} ctx={ctx} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Icon aria-hidden strokeWidth={1.5} className="size-4 text-ink-soft" /> {title}
      </h3>
      {children}
    </section>
  );
}

function Details({ b }: { b: AgendaBooking }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Item icon={Clock} label="Horario" value={`${formatTime(b.startsAt)} – ${formatTime(endOf(b))} hs`} />
      <Item icon={CalendarClock} label="Duración" value={formatDuration(b.durationMinutes)} />
      <Item icon={Wallet} label="Precio" value={<Price amount={b.priceArs} />} />
      <Item icon={UserRound} label="Profesional" value={b.staffName} />
      <Item
        icon={Phone}
        label="WhatsApp"
        value={
          <a className="underline-offset-4 hover:underline" href={waLink(b.client.phoneE164, "")} target="_blank" rel="noopener noreferrer">
            {b.client.phoneE164}
          </a>
        }
      />
      <Item icon={Hash} label="Código" value={<span className="tracking-[0.1em]">{b.publicCode}</span>} />
    </dl>
  );
}

function Item({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-sm bg-ink/[0.03] px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        <Icon aria-hidden strokeWidth={1.5} className="size-3.5" /> {label}
      </dt>
      <dd className="mt-1 break-words text-sm">{value}</dd>
    </div>
  );
}

/** Estado del turno como botones (un toque), en vez de un menú desplegable. */
function StatusPicker({ b }: { b: AgendaBooking }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(status: BookingStatusValue) {
    if (status === b.status) return;
    setError(null);
    startTransition(async () => {
      const r = await setBookingStatusAction({ bookingId: b.id, status });
      if (!r.success) setError(r.error);
    });
  }

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
        Estado {pending && <Loader2 aria-label="Guardando" className="size-3.5 animate-spin text-muted" />}
      </h3>
      <div role="radiogroup" aria-label="Estado del turno" className="flex flex-wrap gap-2">
        {OPERATIVE.map((s) => {
          const on = s === b.status;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={pending}
              onClick={() => change(s)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs transition-all disabled:opacity-60",
                on ? cn("border-transparent", STATUS_CLASS[s]) : "border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink",
              )}
            >
              <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[s], !on && "opacity-50")} />
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-st-cancelled">
          {error}
        </p>
      )}
    </section>
  );
}

function WhatsAppActions({ b, ctx }: { b: AgendaBooking; ctx: WaContext }) {
  const templates: WaTemplate[] = ["confirmation", "reminder", "reschedule"];
  return (
    <Section icon={MessageCircle} title="Avisar por WhatsApp">
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <a
            key={t}
            href={waLink(b.client.phoneE164, waMessage(t, ctx))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-ink/15 px-3.5 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <MessageCircle aria-hidden className="size-3.5" /> {WA_TEMPLATE_LABEL[t]}
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
    <Section icon={NotebookPen} title="Ficha del cliente">
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip>
          <strong className="font-medium text-ink">{c.visits}</strong> {c.visits === 1 ? "visita" : "visitas"}
        </Chip>
        <Chip>
          <strong className={cn("font-medium", c.noShows > 0 ? "text-st-noshow" : "text-ink")}>{c.noShows}</strong> {c.noShows === 1 ? "ausencia" : "ausencias"}
        </Chip>
        {c.favoriteService && (
          <Chip>
            Habitual: <strong className="font-medium text-ink">{c.favoriteService}</strong>
          </Chip>
        )}
        <Link
          href={`/admin/clientes/${c.id}`}
          className="inline-flex items-center gap-1 rounded-full border border-ink/25 px-3 py-1 text-xs text-ink transition-colors hover:border-ink"
        >
          Ver ficha completa <ArrowUpRight aria-hidden className="size-3.5" />
        </Link>
      </div>

      {c.history.length > 0 && (
        <ul className="mb-5 flex flex-col divide-y divide-ink/5 text-sm">
          {c.history.map((h) => (
            <li key={h.bookingId} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">
                <span className="text-ink-soft">{formatLongDate(h.startsAt)}</span> · {h.serviceName}
              </span>
              <StatusBadge status={h.status} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <p className="label-wide text-muted">Notas técnicas</p>
        {c.notes.length === 0 && <p className="text-sm text-muted">Sin notas todavía.</p>}
        <ul className="flex flex-col gap-2">
          {c.notes.map((n) => (
            <li key={n.id} className="rounded-sm border-l-2 border-ink/30 bg-ink/[0.03] px-3 py-2.5 text-sm">
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
          className="mt-1 w-full rounded-sm border border-ink/10 bg-ink/[0.03] p-3 text-sm placeholder:text-muted/70 focus-visible:border-ink"
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

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-ink/10 px-3 py-1 text-xs text-ink-soft">{children}</span>;
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

  if (!isActive && !cancelled) return null;

  return (
    <section className="border-t border-ink/10 pt-5">
      {isActive && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}>
            <CalendarClock aria-hidden className="size-4" /> Reprogramar
          </Button>
          <Button variant="ghost" size="sm" className="text-st-cancelled hover:bg-st-cancelled/10" onClick={() => setConfirmOpen(true)}>
            <CalendarX2 aria-hidden className="size-4" /> Cancelar turno
          </Button>
        </div>
      )}
      {cancelled && (
        <p className="text-sm text-muted">
          Turno cancelado: el horario quedó libre.{" "}
          <a className="text-ink underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={waLink(b.client.phoneE164, waMessage("cancellation", ctx))}>
            Avisar al cliente por WhatsApp
          </a>
        </p>
      )}

      <RescheduleDialog booking={b} ctx={ctx} open={moveOpen} onClose={() => setMoveOpen(false)} />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Cancelar turno">
        {cancelledNow ? (
          <div className="flex flex-col gap-4">
            {autoSent ? (
              <p>
                El turno se canceló, el horario quedó libre y <strong>le avisamos al cliente por WhatsApp</strong>.
              </p>
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
              Vas a cancelar el turno de{" "}
              <strong>
                {b.client.firstName} {b.client.lastName}
              </strong>{" "}
              del {ctx.dateLabel} a las {ctx.timeLabel} hs. El horario va a quedar libre para nuevas reservas.
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
    </section>
  );
}
