import { ArrowLeft, CalendarClock, CalendarDays, CalendarHeart, HeartHandshake, MessageCircle, Scissors, Sparkles, UserRound, UserX, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ClientAvatar } from "@/components/admin/client-avatar";
import { ClientNotes, EditClientName } from "@/components/admin/client-tools";
import { PhotoGallery } from "@/components/admin/photo-gallery";
import { StatusBadge } from "@/components/admin/status-badge";
import { Panel, PanelTitle } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { localDateString } from "@/lib/dates";
import { formatAgo, formatLongDate, formatPhone, formatShortDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { waComeBack, waGreeting, waLink } from "@/lib/wa-links";
import { loadConfig } from "@/server/services/booking";
import { getPublicInfo } from "@/server/services/catalog";
import { getClientDetail } from "@/server/services/clients";

export const metadata = { title: "Cliente — MG Estudio" };

export default function ClientPage({ params }: PageProps<"/admin/clientes/[id]">) {
  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/clientes" className="-mb-4 inline-flex w-fit items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Todos los clientes
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-sm bg-ink/[0.04]" />}>
        <Client params={params} />
      </Suspense>
    </div>
  );
}

async function Client({ params }: { params: PageProps<"/admin/clientes/[id]">["params"] }) {
  await connection(); // próximos turnos y "hace cuánto" dependen de la fecha actual
  const { id } = await params;
  const [c, info, { timezone }] = await Promise.all([getClientDetail(id), getPublicInfo(), loadConfig()]);
  if (!c) notFound();

  const rebookUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");

  return (
    <>
      <header className="flex flex-wrap items-center gap-5">
        <ClientAvatar firstName={c.firstName} lastName={c.lastName} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="label-wide mb-2 text-muted">Ficha del cliente</p>
          <h1 className="text-[2rem] font-medium leading-tight tracking-tight">{name}</h1>
          <p className="mt-1 text-ink-soft tabular-nums">{formatPhone(c.phoneE164)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={waLink(c.phoneE164, waGreeting(c.firstName, info.businessName))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <MessageCircle aria-hidden className="size-4" /> WhatsApp
          </a>
          <EditClientName clientId={c.id} firstName={c.firstName} lastName={c.lastName} />
        </div>
      </header>

      {c.inactive && c.daysSinceLastVisit !== null && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-st-pending/30 bg-st-pending/[0.07] p-5">
          <div className="flex items-start gap-3">
            <HeartHandshake aria-hidden className="mt-0.5 size-5 shrink-0 text-st-pending" />
            <div>
              <p className="font-medium">Hace {c.daysSinceLastVisit} días que no viene</p>
              <p className="text-sm text-ink-soft">Mandale un mensaje para invitarlo a reservar de nuevo. Ya va escrito, con el link de la página.</p>
            </div>
          </div>
          <a
            href={waLink(c.phoneE164, waComeBack(c.firstName, info.businessName, rebookUrl))}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "sm" }), "bg-st-pending text-cream hover:bg-st-pending/90")}
          >
            <MessageCircle aria-hidden className="size-4" /> Invitarlo a volver
          </a>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Sparkles} label="Visitas" value={c.visits} hint={c.lastVisitAt ? `Última ${formatAgo(c.daysSinceLastVisit ?? 0)}` : "Todavía no vino"} />
        <Stat icon={Wallet} label="Gastado" value={<Price amount={c.spentArs} className="font-light" />} hint="En turnos completados" />
        <Stat
          icon={UserX}
          label="Ausencias"
          value={c.noShows}
          hint={c.cancellations === 0 ? "Sin cancelaciones" : c.cancellations === 1 ? "1 cancelación" : `${c.cancellations} cancelaciones`}
          warn={c.noShows > 0}
        />
        <Stat icon={CalendarHeart} label="Cliente desde" value={<span className="text-2xl">{formatShortDate(c.createdAt)}</span>} hint="Primera reserva" />
      </dl>

      <div className="flex flex-wrap gap-2">
        {c.nextBookingAt && (
          <Chip icon={CalendarClock} tone="confirmed">
            Próximo turno:{" "}
            <Link href={`/admin?d=${localDateString(new Date(c.nextBookingAt), timezone)}`} className="font-medium underline-offset-4 hover:underline">
              {formatLongDate(c.nextBookingAt)}, {formatTime(c.nextBookingAt)} hs
            </Link>
          </Chip>
        )}
        {c.favoriteService && (
          <Chip icon={Scissors}>
            Siempre se hace: <strong className="font-medium text-ink">{c.favoriteService}</strong>
          </Chip>
        )}
        {c.favoriteStaff && (
          <Chip icon={UserRound}>
            Se atiende con: <strong className="font-medium text-ink">{c.favoriteStaff}</strong>
          </Chip>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel>
          <PanelTitle
            icon={CalendarDays}
            title="Historial de turnos"
            description={c.bookings.length === 1 ? "1 turno en total" : `${c.bookings.length} turnos en total. Tocá uno para verlo en la agenda.`}
          />
          <ul className="-mx-2 flex flex-col divide-y divide-ink/5">
            {c.bookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin?d=${localDateString(new Date(b.startsAt), timezone)}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm px-2 py-3 transition-colors hover:bg-ink/[0.03]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {formatLongDate(b.startsAt)} · {formatTime(b.startsAt)} hs
                      {b.upcoming && <span className="ml-2 text-xs font-normal text-st-confirmed">próximo</span>}
                    </span>
                    <span className="block text-sm text-muted">
                      {b.serviceName} · {b.staffName}
                    </span>
                  </span>
                  <Price amount={b.priceArs} className="text-sm text-ink-soft" />
                  <StatusBadge status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel>
            <ClientNotes clientId={c.id} notes={c.notes} />
          </Panel>
          <Panel>
            <Section title="Fotos del resultado">
              <PhotoGallery photos={c.resultPhotos} emptyText="Todavía no hay fotos. Se suben desde el turno, en la Agenda." />
            </Section>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <PanelTitle icon={Sparkles} title={title} />
      {children}
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, warn }: { icon: LucideIcon; label: string; value: ReactNode; hint: string; warn?: boolean }) {
  return (
    <div className="surface-card p-4">
      <dt className="flex items-center gap-2 text-sm text-ink-soft">
        <Icon aria-hidden strokeWidth={1.5} className={cn("size-4", warn ? "text-st-noshow" : "text-muted")} /> {label}
      </dt>
      <dd className={cn("mt-2 text-3xl font-light tabular-nums leading-none", warn && "text-st-noshow")}>{value}</dd>
      <dd className="mt-2 text-xs text-muted">{hint}</dd>
    </div>
  );
}

function Chip({ icon: Icon, tone, children }: { icon: LucideIcon; tone?: "confirmed"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm",
        tone === "confirmed" ? "border-st-confirmed/30 bg-st-confirmed/10 text-st-confirmed" : "border-ink/10 text-ink-soft",
      )}
    >
      <Icon aria-hidden className="size-4" />
      <span>{children}</span>
    </span>
  );
}
