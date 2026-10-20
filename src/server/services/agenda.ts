import "server-only";
import { db } from "@/lib/db";
import { addDaysToDateString, dayBoundsUtc, localDateString, timeToMinutes, weekdayOfDateString } from "@/lib/dates";
import { ACTIVE, REVENUE, type BookingStatusValue } from "@/lib/booking-status";
import type { AgendaBooking, AgendaClient, DayCount, DayMetrics } from "@/types/admin";
import { loadConfig, loadStaffSchedules } from "./booking";
import { monthRange } from "@/lib/months";
import { weekRange, weekStart } from "@/lib/weeks";
import { buildReport, occupancyRatio, type Report } from "./report";

/** Cantidad de turnos activos por día, para `days` días desde `fromDate`. */
export async function getDayCounts(fromDate: string, days: number): Promise<DayCount[]> {
  const { timezone } = await loadConfig();
  const from = dayBoundsUtc(fromDate, timezone).start;
  const to = dayBoundsUtc(addDaysToDateString(fromDate, days - 1), timezone).end;

  const rows = await db.booking.findMany({
    where: { startDatetime: { gte: from, lt: to }, status: { in: ACTIVE as BookingStatusValue[] } },
    select: { startDatetime: true },
  });

  const counts = new Map<string, number>();
  for (const r of rows) {
    const d = localDateString(r.startDatetime, timezone);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysToDateString(fromDate, i);
    return { date, count: counts.get(date) ?? 0 };
  });
}

/** Turnos del día (incluye cancelados, marcados por estado) con fotos e historial del cliente. */
export async function getDayAgenda(date: string): Promise<AgendaBooking[]> {
  const { timezone } = await loadConfig();
  const { start, end } = dayBoundsUtc(date, timezone);

  const bookings = await db.booking.findMany({
    where: { startDatetime: { gte: start, lt: end } },
    orderBy: { startDatetime: "asc" },
    include: { client: true, staff: true, photos: { orderBy: { createdAt: "asc" } } },
  });
  if (bookings.length === 0) return [];

  const clientIds = [...new Set(bookings.map((b) => b.clientId))];
  const [allBookings, allNotes, allResultPhotos] = await Promise.all([
    db.booking.findMany({
      where: { clientId: { in: clientIds } },
      orderBy: { startDatetime: "desc" },
      select: { id: true, clientId: true, startDatetime: true, serviceNameSnapshot: true, status: true },
    }),
    db.clientNote.findMany({ where: { clientId: { in: clientIds } }, orderBy: { createdAt: "desc" } }),
    db.bookingPhoto.findMany({
      where: { kind: "RESULT", booking: { clientId: { in: clientIds } } },
      include: { booking: { select: { clientId: true, startDatetime: true, serviceNameSnapshot: true } } },
      orderBy: { booking: { startDatetime: "desc" } },
    }),
  ]);

  const clientView = (clientId: string, currentBookingId: string): Omit<AgendaClient, "id" | "firstName" | "lastName" | "phoneE164"> => {
    const mine = allBookings.filter((b) => b.clientId === clientId);
    const done = mine.filter((b) => b.status === "COMPLETED");
    const counts = new Map<string, number>();
    for (const b of done) counts.set(b.serviceNameSnapshot, (counts.get(b.serviceNameSnapshot) ?? 0) + 1);
    const favorite = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      visits: done.length,
      noShows: mine.filter((b) => b.status === "NO_SHOW").length,
      favoriteService: favorite,
      history: mine
        .filter((b) => b.id !== currentBookingId)
        .slice(0, 6)
        .map((b) => ({ bookingId: b.id, startsAt: b.startDatetime.toISOString(), serviceName: b.serviceNameSnapshot, status: b.status })),
      notes: allNotes
        .filter((n) => n.clientId === clientId)
        .map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt.toISOString() })),
      resultPhotos: allResultPhotos
        .filter((p) => p.booking.clientId === clientId)
        .map((p) => ({
          id: p.id,
          url: p.secureUrl,
          bookingId: p.bookingId,
          startsAt: p.booking.startDatetime.toISOString(),
          serviceName: p.booking.serviceNameSnapshot,
        })),
    };
  };

  return bookings.map((b) => ({
    id: b.id,
    publicCode: b.publicCode,
    startsAt: b.startDatetime.toISOString(),
    endsAt: b.endDatetime.toISOString(),
    durationMinutes: b.durationMinutes,
    serviceName: b.serviceNameSnapshot,
    priceArs: b.priceArs,
    status: b.status,
    staffName: b.staff.name,
    client: {
      id: b.client.id,
      firstName: b.client.firstName,
      lastName: b.client.lastName,
      phoneE164: b.client.phoneE164,
      ...clientView(b.clientId, b.id),
    },
    photos: b.photos.map((p) => ({ id: p.id, url: p.secureUrl, kind: p.kind })),
  }));
}

/** Resumen rápido del día para la columna derecha. */
export async function getDayMetrics(date: string): Promise<DayMetrics> {
  const [{ timezone }, schedules] = await Promise.all([loadConfig(), loadStaffSchedules()]);
  const { start, end } = dayBoundsUtc(date, timezone);

  const rows = await db.booking.findMany({
    where: { startDatetime: { gte: start, lt: end }, status: { in: ACTIVE.concat("COMPLETED") as BookingStatusValue[] } },
    select: { priceArs: true, durationMinutes: true, status: true },
  });

  const weekday = weekdayOfDateString(date);
  const availableMinutes = schedules
    .flatMap((s) => s.hours)
    .filter((h) => h.weekday === weekday)
    .reduce((sum, h) => sum + timeToMinutes(h.end) - timeToMinutes(h.start), 0);
  const bookedMinutes = rows.reduce((sum, r) => sum + r.durationMinutes, 0);

  return {
    date,
    totalBookings: rows.length,
    revenueArs: rows.filter((r) => REVENUE.includes(r.status)).reduce((sum, r) => sum + r.priceArs, 0),
    occupancy: occupancyRatio(bookedMinutes, availableMinutes),
  };
}

/** Reporte detallado entre dos fechas locales (ambas inclusive). */
export async function getReport(fromDate: string, toDate: string): Promise<Report> {
  const { timezone } = await loadConfig();
  const from = dayBoundsUtc(fromDate, timezone).start;
  const to = dayBoundsUtc(toDate, timezone).end;

  const rows = await db.booking.findMany({
    where: { startDatetime: { gte: from, lt: to } },
    select: { startDatetime: true, serviceNameSnapshot: true, priceArs: true, durationMinutes: true, status: true, staff: { select: { name: true } } },
  });

  return buildReport(
    rows.map((r) => ({
      startsAt: r.startDatetime,
      serviceName: r.serviceNameSnapshot,
      staffName: r.staff.name,
      priceArs: r.priceArs,
      durationMinutes: r.durationMinutes,
      status: r.status,
    })),
    timezone,
  );
}

export interface PeriodSummary {
  key: string; // mes "yyyy-MM" o lunes de la semana "yyyy-MM-dd"
  bookings: number; // sin cancelados
}

/** Turnos (sin cancelados) agrupados por período. Una sola consulta para toda la historia. */
async function countBookingsBy(keyOf: (localDate: string) => string): Promise<Map<string, number>> {
  const { timezone } = await loadConfig();
  const rows = await db.booking.findMany({ select: { startDatetime: true, status: true } });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = keyOf(localDateString(r.startDatetime, timezone));
    const cancelled = r.status === "CANCELLED_BY_ADMIN" || r.status === "CANCELLED_BY_CLIENT";
    counts.set(key, (counts.get(key) ?? 0) + (cancelled ? 0 : 1));
  }
  return counts;
}

/**
 * Meses con historial para la sección Reportes: desde el primer mes con turnos hasta el actual
 * (y los siguientes si ya hay turnos agendados), con cuántos turnos tuvo cada uno.
 */
export async function getMonthSummaries(currentMonth: string): Promise<PeriodSummary[]> {
  const counts = await countBookingsBy((d) => d.slice(0, 7));
  const keys = [...counts.keys(), currentMonth].sort();
  return monthRange(keys[0], keys[keys.length - 1]).map((key) => ({ key, bookings: counts.get(key) ?? 0 }));
}

/** Igual que los meses, pero por semana (lunes a domingo). */
export async function getWeekSummaries(currentWeek: string): Promise<PeriodSummary[]> {
  const counts = await countBookingsBy(weekStart);
  const keys = [...counts.keys(), currentWeek].sort();
  return weekRange(keys[0], keys[keys.length - 1]).map((key) => ({ key, bookings: counts.get(key) ?? 0 }));
}
