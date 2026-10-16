import { Suspense } from "react";
import { BookingTimeline } from "@/components/admin/booking-timeline";
import { DayRail } from "@/components/admin/day-rail";
import { MetricsPanel } from "@/components/admin/metrics-panel";
import { addDaysToDateString, isDateString, localDateString } from "@/lib/dates";
import { formatLongDate } from "@/lib/format";
import { zonedToUtc } from "@/lib/dates";
import { getDayAgenda, getDayCounts, getDayMetrics, getReport } from "@/server/services/agenda";
import { loadConfig } from "@/server/services/booking";
import { getPublicInfo } from "@/server/services/catalog";

const RAIL_DAYS = 14;

export default async function AgendaPage({ searchParams }: PageProps<"/admin">) {
  const { d } = await searchParams;
  const config = await loadConfig();
  const today = localDateString(new Date(), config.timezone);
  const requested = typeof d === "string" && isDateString(d) ? d : today;

  // El selector muestra los próximos 14 días; si se abre un día fuera de ese rango (p. ej. pasado) se antepone.
  const railStart = requested < today ? requested : today;
  const railDays = requested < today ? RAIL_DAYS + 1 : RAIL_DAYS;

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)_18rem]">
      <section aria-label="Selector de fechas">
        <h2 className="label-wide mb-3 text-ink-soft">Próximos días</h2>
        <Suspense fallback={<Skeleton rows={6} />}>
          <Rail from={railStart} days={railDays} selected={requested} today={today} />
        </Suspense>
      </section>

      <section aria-label="Línea de tiempo del día">
        <h2 className="mb-4 font-display text-3xl font-semibold">{formatLongDate(zonedToUtc(requested, "12:00", config.timezone).toISOString())}</h2>
        <Suspense fallback={<Skeleton rows={4} tall />}>
          <Timeline date={requested} />
        </Suspense>
      </section>

      <Suspense fallback={<Skeleton rows={3} />}>
        <Metrics date={requested} />
      </Suspense>
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

function Skeleton({ rows, tall }: { rows: number; tall?: boolean }) {
  return (
    <div aria-busy="true" className="flex animate-pulse flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`rounded-sm bg-cream-deep ${tall ? "h-20" : "h-14"}`} />
      ))}
    </div>
  );
}
