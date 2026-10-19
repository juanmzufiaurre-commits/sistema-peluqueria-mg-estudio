import { BarChart3, CalendarCheck, Gauge, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { cn } from "@/lib/utils";
import type { DayMetrics } from "@/types/admin";

/** Resumen del día + acceso a la sección Reportes en el mes del día elegido. */
export function MetricsPanel({ day, month }: { day: DayMetrics; month: string }) {
  const occupancy = Math.round(day.occupancy * 100);
  return (
    <aside aria-label="Métricas" className="flex flex-col gap-3">
      <h2 className="label-wide text-muted">Resumen del día</h2>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <Stat icon={CalendarCheck} label="Turnos" value={<span className="tabular-nums">{day.totalBookings}</span>} />
        <Stat icon={Wallet} label="Recaudación estimada" value={<Price amount={day.revenueArs} className="font-light" />} />
        <div className="surface-card col-span-2 p-4 lg:col-span-1">
          <StatLabel icon={Gauge} label="Ocupación" />
          <dd className="mt-2 flex items-baseline gap-1 text-3xl font-light tabular-nums leading-none">
            {occupancy}
            <span className="text-base text-muted">%</span>
          </dd>
          <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-gradient-to-r from-ink/60 to-ink" style={{ width: `${Math.min(100, occupancy)}%` }} />
          </div>
        </div>
      </dl>
      <Link href={`/admin/reportes?m=${month}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
        <BarChart3 aria-hidden className="size-4" /> Ver reportes del mes
      </Link>
    </aside>
  );
}

function Stat({ icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="surface-card p-4">
      <StatLabel icon={icon} label={label} />
      <dd className="mt-2 text-3xl font-light leading-none">{value}</dd>
    </div>
  );
}

function StatLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <dt className="flex items-center gap-2 text-sm text-muted">
      <Icon aria-hidden strokeWidth={1.5} className="size-4" /> {label}
    </dt>
  );
}
