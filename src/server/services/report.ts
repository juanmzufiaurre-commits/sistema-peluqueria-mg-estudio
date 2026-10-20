import { localDateString, localTimeString } from "@/lib/dates";
import { REVENUE, type BookingStatusValue } from "@/lib/booking-status";

export interface ReportBooking {
  startsAt: Date;
  serviceName: string;
  /** Quién atendió. Opcional para reportes que no lo necesitan. */
  staffName?: string;
  priceArs: number;
  durationMinutes: number;
  status: BookingStatusValue;
}

export interface Report {
  totalBookings: number; // no cuenta cancelados
  cancelled: number;
  revenueArs: number;
  /** NO_SHOW / (COMPLETED + NO_SHOW). null si todavía no hay turnos finalizados. */
  noShowRate: number | null;
  topServices: { name: string; count: number; revenueArs: number }[];
  /** Turnos (sin cancelados) y facturación estimada de cada profesional, de mayor a menor facturación. */
  byStaff: { name: string; count: number; revenueArs: number; noShows: number }[];
  /** 0 = domingo ... 6 = sábado */
  byWeekday: number[];
  /** Cantidad de turnos por hora de inicio (0-23) */
  byHour: number[];
  /** Facturación estimada por día local "yyyy-MM-dd" */
  revenueByDay: { date: string; revenueArs: number }[];
}

export function buildReport(bookings: ReportBooking[], timezone: string): Report {
  const byWeekday = Array<number>(7).fill(0);
  const byHour = Array<number>(24).fill(0);
  const services = new Map<string, { count: number; revenueArs: number }>();
  const staff = new Map<string, { count: number; revenueArs: number; noShows: number }>();
  const days = new Map<string, number>();
  let totalBookings = 0;
  let cancelled = 0;
  let revenueArs = 0;
  let completed = 0;
  let noShow = 0;

  for (const b of bookings) {
    if (b.status === "CANCELLED_BY_ADMIN" || b.status === "CANCELLED_BY_CLIENT") {
      cancelled++;
      continue;
    }
    totalBookings++;
    if (b.status === "COMPLETED") completed++;
    if (b.status === "NO_SHOW") noShow++;

    const person = staff.get(b.staffName ?? "Sin asignar") ?? { count: 0, revenueArs: 0, noShows: 0 };
    person.count++;
    if (b.status === "NO_SHOW") person.noShows++;
    if (REVENUE.includes(b.status)) person.revenueArs += b.priceArs;
    staff.set(b.staffName ?? "Sin asignar", person);

    const date = localDateString(b.startsAt, timezone);
    byWeekday[new Date(`${date}T00:00:00Z`).getUTCDay()]++;
    byHour[Number(localTimeString(b.startsAt, timezone).slice(0, 2))]++;

    if (REVENUE.includes(b.status)) {
      revenueArs += b.priceArs;
      days.set(date, (days.get(date) ?? 0) + b.priceArs);
      const s = services.get(b.serviceName) ?? { count: 0, revenueArs: 0 };
      s.count++;
      s.revenueArs += b.priceArs;
      services.set(b.serviceName, s);
    }
  }

  return {
    totalBookings,
    cancelled,
    revenueArs,
    noShowRate: completed + noShow === 0 ? null : noShow / (completed + noShow),
    topServices: [...services.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count || b.revenueArs - a.revenueArs),
    byStaff: [...staff.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenueArs - a.revenueArs || b.count - a.count),
    byWeekday,
    byHour,
    revenueByDay: [...days.entries()].map(([date, r]) => ({ date, revenueArs: r })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** Ocupación = minutos reservados (sin buffer) / minutos disponibles. Acotada a [0, 1]. */
export function occupancyRatio(bookedMinutes: number, availableMinutes: number): number {
  if (availableMinutes <= 0) return 0;
  return Math.min(1, bookedMinutes / availableMinutes);
}
