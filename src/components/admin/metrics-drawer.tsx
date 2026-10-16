"use client";

import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatArs } from "@/lib/format";
import type { Report } from "@/server/services/report";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function MetricsDrawer({ report, monthLabel }: { report: Report; monthLabel: string }) {
  const [open, setOpen] = useState(false);
  const maxService = Math.max(1, ...report.topServices.map((s) => s.count));
  const hours = report.byHour.map((n, h) => ({ h, n })).filter((x) => x.h >= 8 && x.h <= 21);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <BarChart3 aria-hidden className="size-4" /> Ver reporte del mes
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title={`Reporte · ${monthLabel}`} variant="drawer">
        <div className="flex flex-col gap-8">
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="Facturación estimada" value={formatArs(report.revenueArs)} />
            <Stat label="Turnos" value={String(report.totalBookings)} />
            <Stat label="Cancelados" value={String(report.cancelled)} />
            <Stat label="Ausentismo" value={report.noShowRate === null ? "—" : `${Math.round(report.noShowRate * 100)}%`} />
          </dl>

          <Block title="Servicios más pedidos">
            {report.topServices.length === 0 ? (
              <Empty />
            ) : (
              <ul className="flex flex-col gap-3">
                {report.topServices.map((s) => (
                  <li key={s.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{s.name}</span>
                      <span className="text-muted">
                        {s.count} · {formatArs(s.revenueArs)}
                      </span>
                    </div>
                    <Bar ratio={s.count / maxService} />
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title="Días de mayor demanda">
            <Columns items={WEEKDAYS.map((label, i) => ({ label, value: report.byWeekday[i] }))} />
          </Block>

          <Block title="Horarios de mayor demanda">
            <Columns items={hours.map(({ h, n }) => ({ label: String(h), value: n }))} />
          </Block>
        </div>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-white/50 p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl leading-none">{value}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="label-wide mb-4 text-ink-soft">{title}</h3>
      {children}
    </section>
  );
}

const Empty = () => <p className="text-sm text-muted">Todavía no hay datos en este período.</p>;

function Bar({ ratio }: { ratio: number }) {
  return (
    <div className="h-2 w-full rounded-sm bg-cream-deep" aria-hidden>
      <div className="h-full rounded-sm bg-ink" style={{ width: `${Math.max(2, ratio * 100)}%` }} />
    </div>
  );
}

function Columns({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.every((i) => i.value === 0)) return <Empty />;
  return (
    <ul className="flex h-32 items-end gap-1" role="list">
      {items.map((i) => (
        <li key={i.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${i.label}: ${i.value}`}>
          <span className="text-[0.65rem] text-muted">{i.value || ""}</span>
          <div className="w-full rounded-sm bg-ink" style={{ height: `${(i.value / max) * 100}%`, minHeight: i.value ? 4 : 0 }} />
          <span className="text-[0.65rem] text-ink-soft">{i.label}</span>
        </li>
      ))}
    </ul>
  );
}
