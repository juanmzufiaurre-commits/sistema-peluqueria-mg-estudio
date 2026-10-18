import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookingTimeline } from "@/components/admin/booking-timeline";
import { DayRail } from "@/components/admin/day-rail";
import { MetricsPanel } from "@/components/admin/metrics-panel";
import { PageHeader } from "@/components/admin/ui";
import { addDaysToDateString, isDateString, localDateString } from "@/lib/dates";
import { formatLongDate } from "@/lib/format";
import { zonedToUtc } from "@/lib/dates";
import { getDayAgenda, getDayCounts, getDayMetrics, getReport } from "@/server/services/agenda";
import { loadConfig } from "@/server/services/booking";
import { getPublicInfo } from "@/server/services/catalog";

const RAIL_DAYS = 14;

export default function AgendaPage({ searchParams }: PageProps<"/admin">) {
  // Todo lo que depende del request (día pedido, hora actual, base) vive dentro de un Suspense.
  return (
    <Suspense fallback={<Skeleton rows={4} tall />}>
      <Agenda searchParams={searchParams} />
    </Suspense>
  );
}

async function Agenda({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await connection(); // "hoy" depende de la hora actual
  const { d } = await searchParams;
  const config = await loadConfig();
  const today = localDateString(new Date(), config.timezone);
  const requested = typeof d === "string" && isDateString(d) ? d : today;

  // El selector muestra los próximos 14 días; si se abre un día fuera de ese rango (p. ej. pasado) se antepone.
  const railStart = requested < today ? requested : today;
  const railDays = requested < today ? RAIL_DAYS + 1 : RAIL_DAYS;

  const dayHref = (date: string) => (date === today ? "/admin" : `/admin?d=${date}`);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={requested === today ? "Agenda · Hoy" : "Agenda"}
        title={formatLongDate(zonedToUtc(requested, "12:00", config.timezone).toISOString())}
        description="Tocá un turno para ver la ficha del cliente, cambiar el estado o avisarle por WhatsApp."
        actions={
          <div className="flex items-center gap-2">
            <DayArrow href={dayHref(addDaysToDateString(requested, -1))} label="Día anterior" icon={ChevronLeft} />
            {requested !== today && (
              <Link href="/admin" scroll={false} className="flex h-10 items-center rounded-full border border-ink/15 px-4 text-xs uppercase tracking-[0.15em] transition-colors hover:border-ink">
                Hoy
              </Link>
            )}
            <DayArrow href={dayHref(addDaysToDateString(requested, 1))} label="Día siguiente" icon={ChevronRight} />
          </div>
        }
      />

      <section aria-label="Selector de fechas" className="-mt-2">
        <Suspense fallback={<Skeleton rows={1} />}>
          <Rail from={railStart} days={railDays} selected={requested} today={today} />
        </Suspense>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-label="Turnos del día">
          <Suspense fallback={<Skeleton rows={4} tall />}>
            <Timeline date={requested} />
          </Suspense>
        </section>

        <Suspense fallback={<Skeleton rows={3} />}>
          <Metrics date={requested} />
        </Suspense>
      </div>
    </div>
  );
}

async function Rail({ from, days, selected, today }: { from: string; days: number; selected: string; today: string }) {
  return <DayRail days={await getDayCounts(from, days)} selected={selected} today={today} />;
}

async function Timeline({ date }: { date: string }) {
  const [bookings, info] = await Promise.all([getDayAgenda(date), getPublicInfo()]);
  const rebookUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return <BookingTimeline bookings={bookings} businessName={info.businessName} address={info.address} rebookUrl={rebookUrl} />;
}

async function Metrics({ date }: { date: string }) {
  const monthStart = `${date.slice(0, 7)}-01`;
  const nextMonth = new Date(`${monthStart}T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const monthEnd = addDaysToDateString(nextMonth.toISOString().slice(0, 10), -1);

  const [day, month] = await Promise.all([getDayMetrics(date), getReport(monthStart, monthEnd)]);
  const label = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${monthStart}T12:00:00Z`));
  return <MetricsPanel day={day} month={month} monthLabel={label} />;
}

function DayArrow({ href, label, icon: Icon }: { href: string; label: string; icon: typeof ChevronLeft }) {
  return (
    <Link href={href} scroll={false} aria-label={label} className="flex size-10 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink">
      <Icon aria-hidden className="size-4" />
    </Link>
  );
}

function Skeleton({ rows, tall }: { rows: number; tall?: boolean }) {
  return (
    <div aria-busy="true" className="flex animate-pulse flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`rounded-sm bg-ink/[0.04] ${tall ? "h-20" : "h-24"}`} />
      ))}
    </div>
  );
}
