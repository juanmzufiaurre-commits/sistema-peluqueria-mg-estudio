import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PeriodRail, type PeriodItem } from "@/components/admin/period-rail";
import { ReportView } from "@/components/admin/report-view";
import { PageHeader } from "@/components/admin/ui";
import { addDaysToDateString, localDateString } from "@/lib/dates";
import { addMonths, isMonthString, monthBounds, monthLabel, monthShort } from "@/lib/months";
import { cn } from "@/lib/utils";
import { addWeeks, isWeekStart, weekDays, weekLabel, weekStart } from "@/lib/weeks";
import { getMonthSummaries, getReport, getWeekSummaries, type PeriodSummary } from "@/server/services/agenda";
import { loadConfig } from "@/server/services/booking";

export const metadata = { title: "Reportes — MG Estudio" };

const ucFirst = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function ReportsPage({ searchParams }: PageProps<"/admin/reportes">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-sm bg-ink/[0.04]" />}>
      <Reports searchParams={searchParams} />
    </Suspense>
  );
}

async function Reports({ searchParams }: { searchParams: PageProps<"/admin/reportes">["searchParams"] }) {
  await connection(); // "este mes" / "esta semana" dependen de la fecha actual
  const params = await searchParams;
  const { timezone } = await loadConfig();
  const today = localDateString(new Date(), timezone);
  const weekly = params.vista === "semana";

  return weekly ? <WeekReport today={today} requested={params.s} /> : <MonthReport today={today} requested={params.m} />;
}

async function MonthReport({ today, requested }: { today: string; requested: string | string[] | undefined }) {
  const current = today.slice(0, 7);
  const selected = typeof requested === "string" && isMonthString(requested) ? requested : current;
  const { first, last } = monthBounds(selected);
  const prev = monthBounds(addMonths(selected, -1));
  const [months, report, previous] = await Promise.all([getMonthSummaries(current), getReport(first, last), getReport(prev.first, prev.last)]);

  const items: PeriodItem[] = withSelected(months, selected).map((m) => ({
    key: m.key,
    href: `/admin/reportes?m=${m.key}`,
    top: m.key === current ? "Este mes" : m.key.slice(0, 4),
    main: monthShort(m.key),
    bookings: m.bookings,
  }));
  const days = Array.from({ length: Number(last.slice(8)) }, (_, i) => addDaysToDateString(first, i));

  return (
    <Layout
      weekly={false}
      eyebrow={selected === current ? "Reportes · Este mes" : "Reportes · Mensual"}
      title={ucFirst(monthLabel(selected))}
      rail={<PeriodRail items={items} selected={selected} label="Meses" />}
    >
      <ReportView report={report} previous={previous} days={days.map((d) => ({ date: d, label: String(Number(d.slice(8))) }))} period="mes" />
    </Layout>
  );
}

async function WeekReport({ today, requested }: { today: string; requested: string | string[] | undefined }) {
  const current = weekStart(today);
  const selected = typeof requested === "string" && isWeekStart(requested) ? requested : current;
  const days = weekDays(selected);
  const prevDays = weekDays(addWeeks(selected, -1));
  const [weeks, report, previous] = await Promise.all([
    getWeekSummaries(current),
    getReport(days[0], days[6]),
    getReport(prevDays[0], prevDays[6]),
  ]);

  const items: PeriodItem[] = withSelected(weeks, selected).map((w) => ({
    key: w.key,
    href: `/admin/reportes?vista=semana&s=${w.key}`,
    top: w.key === current ? "Esta semana" : w.key.slice(0, 4),
    main: weekLabel(w.key),
    bookings: w.bookings,
  }));

  return (
    <Layout
      weekly
      eyebrow={selected === current ? "Reportes · Esta semana" : "Reportes · Semanal"}
      title={`Semana del ${weekLabel(selected)}`}
      rail={<PeriodRail items={items} selected={selected} label="Semanas" wide />}
    >
      <ReportView
        report={report}
        previous={previous}
        days={days.map((d) => ({ date: d, label: `${WEEKDAY_SHORT[new Date(`${d}T12:00:00Z`).getUTCDay()]} ${Number(d.slice(8))}` }))}
        period="semana"
      />
    </Layout>
  );
}

/** El período pedido aparece en la tira aunque esté fuera del historial (p. ej. un link viejo). */
function withSelected(list: PeriodSummary[], selected: string): PeriodSummary[] {
  return list.some((x) => x.key === selected) ? list : [...list, { key: selected, bookings: 0 }].sort((a, b) => a.key.localeCompare(b.key));
}

function Layout({ weekly, eyebrow, title, rail, children }: { weekly: boolean; eyebrow: string; title: string; rail: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description="Facturación, turnos, cancelaciones e ingresos de cada profesional. Se arma solo con los turnos de la agenda."
        actions={
          <div role="tablist" aria-label="Período" className="flex rounded-full border border-ink/15 p-1">
            <Tab href="/admin/reportes" active={!weekly} label="Mes" />
            <Tab href="/admin/reportes?vista=semana" active={weekly} label="Semana" />
          </div>
        }
      />
      <div className="-mt-2">{rail}</div>
      {children}
    </div>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      scroll={false}
      className={cn("rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors", active ? "bg-ink text-cream" : "text-ink-soft hover:text-ink")}
    >
      {label}
    </Link>
  );
}
