import { connection } from "next/server";
import { Suspense } from "react";
import { BookingTimeline } from "@/components/admin/booking-timeline";
import { DayRail } from "@/components/admin/day-rail";
import { MetricsPanel } from "@/components/admin/metrics-panel";
import { PageHeader } from "@/components/admin/ui";
import { addDaysToDateString, isDateString, localDateString } from "@/lib/dates";
import { formatLongDate } from "@/lib/format";
import { zonedToUtc } from "@/lib/dates";
import { getDayAgenda, getDayCounts, getDayMetrics } from "@/server/services/agenda";
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

  // La tira muestra 14 días desde hoy. Si el día elegido queda afuera (pasado o muy adelante),
  // la tira se corre para incluirlo con algunos días de contexto antes.
  const lastDefault = addDaysToDateString(today, RAIL_DAYS - 1);
  const railStart = requested >= today && requested <= lastDefault ? today : addDaysToDateString(requested, -3);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={requested === today ? "Agenda · Hoy" : "Agenda"}
        title={formatLongDate(zonedToUtc(requested, "12:00", config.timezone).toISOString())}
        description="Tocá un turno para ver la ficha del cliente, cambiar el estado o avisarle por WhatsApp."
      />

      <section aria-label="Selector de fechas" className="-mt-2">
        <Suspense fallback={<Skeleton rows={1} />}>
          <Rail from={railStart} days={RAIL_DAYS} selected={requested} today={today} />
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
  return (
    <DayRail
      days={await getDayCounts(from, days)}
      selected={selected}
      today={today}
      prev={addDaysToDateString(selected, -1)}
      next={addDaysToDateString(selected, 1)}
    />
  );
}

async function Timeline({ date }: { date: string }) {
  const [bookings, info] = await Promise.all([getDayAgenda(date), getPublicInfo()]);
  const rebookUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return <BookingTimeline bookings={bookings} businessName={info.businessName} address={info.address} rebookUrl={rebookUrl} />;
}

async function Metrics({ date }: { date: string }) {
  return <MetricsPanel day={await getDayMetrics(date)} month={date.slice(0, 7)} />;
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
