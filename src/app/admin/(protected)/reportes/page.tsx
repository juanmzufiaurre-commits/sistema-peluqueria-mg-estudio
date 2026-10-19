import { connection } from "next/server";
import { Suspense } from "react";
import { MonthRail } from "@/components/admin/month-rail";
import { ReportView } from "@/components/admin/report-view";
import { PageHeader } from "@/components/admin/ui";
import { localDateString } from "@/lib/dates";
import { addMonths, isMonthString, monthBounds, monthLabel } from "@/lib/months";
import { getMonthSummaries, getReport } from "@/server/services/agenda";
import { loadConfig } from "@/server/services/booking";

export const metadata = { title: "Reportes — MG Estudio" };

export default function ReportsPage({ searchParams }: PageProps<"/admin/reportes">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-sm bg-ink/[0.04]" />}>
      <Reports searchParams={searchParams} />
    </Suspense>
  );
}

async function Reports({ searchParams }: { searchParams: PageProps<"/admin/reportes">["searchParams"] }) {
  await connection(); // "este mes" depende de la fecha actual
  const { m } = await searchParams;
  const { timezone } = await loadConfig();
  const current = localDateString(new Date(), timezone).slice(0, 7);
  const selected = typeof m === "string" && isMonthString(m) ? m : current;

  const { first, last } = monthBounds(selected);
  const prev = monthBounds(addMonths(selected, -1));
  const [months, report, previous] = await Promise.all([getMonthSummaries(current), getReport(first, last), getReport(prev.first, prev.last)]);
  // El mes pedido aparece en la tira aunque esté fuera del historial (p. ej. un link viejo).
  const rail = months.some((x) => x.month === selected) ? months : [...months, { month: selected, bookings: 0 }].sort((a, b) => a.month.localeCompare(b.month));
  const days = Array.from({ length: Number(last.slice(8)) }, (_, i) => `${selected}-${String(i + 1).padStart(2, "0")}`);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={selected === current ? "Reportes · Este mes" : "Reportes"}
        title={monthLabel(selected).replace(/^./, (c) => c.toUpperCase())}
        description="El historial de cada mes: facturación, turnos, cancelaciones y lo que más se pide. Se arma solo con los turnos de la agenda."
      />
      <div className="-mt-2">
        <MonthRail months={rail} selected={selected} current={current} />
      </div>
      <ReportView report={report} previous={previous} days={days} />
    </div>
  );
}
