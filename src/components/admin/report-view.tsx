import { CalendarCheck, CalendarX2, TrendingDown, TrendingUp, Users, UserX, Wallet, type LucideIcon } from "lucide-react";
import { Price } from "@/components/ui/price";
import { formatArs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Report } from "@/server/services/report";
import { EmptyState, Panel, PanelTitle } from "./ui";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Reporte de un período (mes o semana) con la comparación contra el período anterior. */
export function ReportView({
  report,
  previous,
  days,
  period,
}: {
  report: Report;
  previous: Report;
  /** Días del período con su etiqueta para el gráfico ("12" o "Lun 12"). */
  days: { date: string; label: string }[];
  period: "mes" | "semana";
}) {
  const empty = report.totalBookings === 0 && report.cancelled === 0;
  if (empty)
    return (
      <EmptyState
        icon={CalendarCheck}
        title={period === "mes" ? "Sin turnos en este mes" : "Sin turnos en esta semana"}
        text="Cuando haya reservas, acá vas a ver la facturación, lo que gana cada profesional, los servicios más pedidos y los horarios con más demanda."
      />
    );
  const vs = period === "mes" ? "vs. mes anterior" : "vs. semana anterior";
  const prevPersonRevenue = new Map(previous.byStaff.map((s) => [s.name, s.revenueArs]));

  const maxService = Math.max(1, ...report.topServices.map((s) => s.count));
  const byDay = new Map(report.revenueByDay.map((d) => [d.date, d.revenueArs]));
  const hours = report.byHour.map((n, h) => ({ h, n })).filter((x) => x.h >= 8 && x.h <= 21);

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Wallet} label="Facturación estimada" value={<Price amount={report.revenueArs} className="font-light" />} delta={change(report.revenueArs, previous.revenueArs)} vs={vs} />
        <Stat icon={CalendarCheck} label="Turnos" value={report.totalBookings} delta={change(report.totalBookings, previous.totalBookings)} vs={vs} />
        <Stat icon={CalendarX2} label="Cancelados" value={report.cancelled} delta={change(report.cancelled, previous.cancelled)} vs={vs} lowerIsBetter />
        <Stat
          icon={UserX}
          label="Ausentismo"
          value={report.noShowRate === null ? "—" : `${Math.round(report.noShowRate * 100)}%`}
          delta={report.noShowRate === null || previous.noShowRate === null ? null : Math.round((report.noShowRate - previous.noShowRate) * 100)}
          deltaUnit=" pts"
          vs={vs}
          lowerIsBetter
        />
      </dl>

      <Panel>
        <PanelTitle icon={Users} title="Ingresos por profesional" description="Facturación estimada de los turnos que atendió cada uno (sin cancelados ni ausencias)." />
        <ul className="flex flex-col divide-y divide-ink/5">
          {report.byStaff.map((s) => {
            const share = report.revenueArs ? Math.round((s.revenueArs / report.revenueArs) * 100) : 0;
            const delta = change(s.revenueArs, prevPersonRevenue.get(s.name) ?? 0);
            return (
              <li key={s.name} className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-medium">{s.name}</span>
                  <Price amount={s.revenueArs} className="text-xl font-light" />
                </div>
                <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-ink/50 to-ink" style={{ width: `${Math.max(2, share)}%` }} />
                </div>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span>{share}% del total</span>
                  <span>
                    {s.count} {s.count === 1 ? "turno" : "turnos"}
                  </span>
                  {s.noShows > 0 && (
                    <span className="text-st-noshow">
                      {s.noShows} {s.noShows === 1 ? "ausencia" : "ausencias"}
                    </span>
                  )}
                  {delta !== null && (
                    <span className={delta > 0 ? "text-st-confirmed" : delta < 0 ? "text-st-cancelled" : ""}>
                      {delta > 0 ? "+" : ""}
                      {delta}% {vs}
                    </span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <PanelTitle title="Facturación por día" description="Estimada con los turnos no cancelados." />
        <Columns
          tall
          items={days.map(({ date, label }) => ({ label, value: byDay.get(date) ?? 0, title: `${label}: ${formatArs(byDay.get(date) ?? 0)}` }))}
          thinLabels={days.length > 7}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle title="Servicios más pedidos" />
          {report.topServices.length === 0 ? (
            <p className="text-sm text-muted">Sin datos.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {report.topServices.map((s) => (
                <li key={s.name}>
                  <div className="mb-1.5 flex justify-between gap-3 text-sm">
                    <span>{s.name}</span>
                    <span className="text-muted">
                      {s.count} · {formatArs(s.revenueArs)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden>
                    <div className="h-full rounded-full bg-gradient-to-r from-ink/50 to-ink" style={{ width: `${Math.max(2, (s.count / maxService) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelTitle title="Días con más demanda" />
            <Columns items={WEEKDAYS.map((label, i) => ({ label, value: report.byWeekday[i] }))} />
          </Panel>
          <Panel>
            <PanelTitle title="Horarios con más demanda" />
            <Columns items={hours.map(({ h, n }) => ({ label: String(h), value: n }))} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Variación porcentual contra el mes anterior (null si no hay base para comparar). */
function change(now: number, before: number): number | null {
  if (before === 0) return null;
  return Math.round(((now - before) / before) * 100);
}

function Stat({
  icon: Icon,
  label,
  value,
  delta,
  deltaUnit = "%",
  vs,
  lowerIsBetter = false,
}: {
  vs: string;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  delta: number | null;
  deltaUnit?: string;
  lowerIsBetter?: boolean;
}) {
  const good = delta !== null && (lowerIsBetter ? delta < 0 : delta > 0);
  const bad = delta !== null && (lowerIsBetter ? delta > 0 : delta < 0);
  return (
    <div className="surface-card p-4">
      <dt className="flex items-center gap-2 text-sm text-muted">
        <Icon aria-hidden strokeWidth={1.5} className="size-4" /> {label}
      </dt>
      <dd className="mt-2 text-3xl font-light tabular-nums leading-none">{value}</dd>
      <dd className={cn("mt-2 inline-flex items-center gap-1 text-xs", good ? "text-st-confirmed" : bad ? "text-st-cancelled" : "text-muted")}>
        {delta === null ? (
          `${vs.replace("vs.", "Sin datos del")} para comparar`
        ) : (
          <>
            {delta > 0 ? <TrendingUp aria-hidden className="size-3.5" /> : delta < 0 ? <TrendingDown aria-hidden className="size-3.5" /> : null}
            {delta > 0 ? "+" : ""}
            {delta}
            {deltaUnit} {vs}
          </>
        )}
      </dd>
    </div>
  );
}

function Columns({ items, tall, thinLabels }: { items: { label: string; value: number; title?: string }[]; tall?: boolean; thinLabels?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.every((i) => i.value === 0)) return <p className="text-sm text-muted">Sin datos.</p>;
  return (
    <ul className={cn("flex items-end gap-1", tall ? "h-40" : "h-32")}>
      {items.map((i, k) => (
        <li key={`${i.label}-${k}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={i.title ?? `${i.label}: ${i.value}`}>
          {!thinLabels && <span className="text-[0.65rem] text-muted">{i.value || ""}</span>}
          <div className="w-full rounded-t-sm bg-gradient-to-t from-ink/40 to-ink" style={{ height: `${(i.value / max) * 100}%`, minHeight: i.value ? 4 : 0 }} />
          <span className={cn("text-[0.6rem] text-ink-soft", thinLabels && k % 2 === 1 && "max-sm:invisible")}>{i.label}</span>
        </li>
      ))}
    </ul>
  );
}
