import type { Report } from "@/server/services/report";
import { formatArs } from "@/lib/format";
import type { DayMetrics } from "@/types/admin";
import { MetricsDrawer } from "./metrics-drawer";

/** Resumen del día + acceso al reporte detallado del mes (se abre en un drawer). */
export function MetricsPanel({ day, month, monthLabel }: { day: DayMetrics; month: Report; monthLabel: string }) {
  return (
    <aside aria-label="Métricas" className="flex flex-col gap-3">
      <h2 className="label-wide text-ink-soft">Resumen del día</h2>
      <dl className="grid grid-cols-1 gap-3">
        <Stat label="Turnos" value={String(day.totalBookings)} />
        <Stat label="Recaudación estimada" value={formatArs(day.revenueArs)} />
        <Stat label="Ocupación" value={`${Math.round(day.occupancy * 100)}%`} />
      </dl>
      <MetricsDrawer report={month} monthLabel={monthLabel} />
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-white/50 p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-display text-3xl leading-none">{value}</dd>
    </div>
  );
}
