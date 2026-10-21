import "server-only";
import { db } from "@/lib/db";
import { dayBoundsUtc, localDateString } from "@/lib/dates";
import type { ClientDetail, ClientListRow, ClientsSummary } from "@/types/admin";
import { loadConfig } from "./booking";
import {
  REGULAR_VISITS,
  clientStats,
  daysSinceLastVisit,
  isInactive,
  matchesQuery,
  sortClients,
  type ClientBooking,
  type ClientSort,
  type ClientStats,
} from "./client-stats";

const bookingSelect = {
  id: true,
  publicCode: true,
  startDatetime: true,
  status: true,
  priceArs: true,
  serviceNameSnapshot: true,
  staff: { select: { name: true } },
} as const;

type BookingRow = {
  startDatetime: Date;
  status: ClientBooking["status"];
  priceArs: number;
  serviceNameSnapshot: string;
  staff: { name: string } | null;
};

const toStatsInput = (b: BookingRow): ClientBooking => ({
  startsAt: b.startDatetime,
  status: b.status,
  priceArs: b.priceArs,
  serviceName: b.serviceNameSnapshot,
  staffName: b.staff?.name ?? null,
});

const iso = (d: Date | null): string | null => d?.toISOString() ?? null;

/** Desde cuándo es cliente: su primer turno, o cuándo se registró si es anterior. */
const clientSince = (createdAt: Date, s: ClientStats): Date => (s.firstBookingAt && s.firstBookingAt < createdAt ? s.firstBookingAt : createdAt);

function toRow(
  c: { id: string; firstName: string; lastName: string | null; phoneE164: string; createdAt: Date },
  s: ClientStats,
  now: Date,
): ClientListRow {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    phoneE164: c.phoneE164,
    createdAt: clientSince(c.createdAt, s).toISOString(),
    visits: s.visits,
    noShows: s.noShows,
    spentArs: s.spentArs,
    lastVisitAt: iso(s.lastVisitAt),
    daysSinceLastVisit: daysSinceLastVisit(s, now),
    nextBookingAt: iso(s.nextBookingAt),
    favoriteService: s.favoriteService,
    inactive: isInactive(s, now),
  };
}

/**
 * Base de clientes con sus números. El resumen es siempre de todos; la lista respeta la búsqueda
 * y el orden. Se calcula en memoria: un estudio tiene cientos de clientes, no millones.
 */
export async function listClients(query: string, sort: ClientSort): Promise<{ summary: ClientsSummary; rows: ClientListRow[] }> {
  const now = new Date();
  const { timezone } = await loadConfig();
  const monthStart = dayBoundsUtc(`${localDateString(now, timezone).slice(0, 7)}-01`, timezone).start;

  const clients = await db.client.findMany({ include: { bookings: { select: bookingSelect } } });
  const all = clients.map((c) => ({ ...c, stats: clientStats(c.bookings.map(toStatsInput), now) }));

  const summary: ClientsSummary = {
    total: all.length,
    newThisMonth: all.filter((c) => clientSince(c.createdAt, c.stats) >= monthStart).length,
    regulars: all.filter((c) => c.stats.visits >= REGULAR_VISITS).length,
    inactive: all.filter((c) => isInactive(c.stats, now)).length,
  };

  const rows = sortClients(
    all.filter((c) => matchesQuery(c, query)),
    sort,
    now,
  ).map((c) => toRow(c, c.stats, now));
  return { summary, rows };
}

/** Ficha completa de un cliente: números, todos sus turnos, notas y fotos del resultado. */
export async function getClientDetail(id: string): Promise<ClientDetail | null> {
  const client = await db.client.findUnique({
    where: { id },
    include: {
      bookings: { select: bookingSelect, orderBy: { startDatetime: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) return null;

  const now = new Date();
  const stats = clientStats(client.bookings.map(toStatsInput), now);
  const photos = await db.bookingPhoto.findMany({
    where: { kind: "RESULT", booking: { clientId: id } },
    orderBy: { booking: { startDatetime: "desc" } },
  });

  return {
    ...toRow(client, stats, now),
    cancellations: stats.cancellations,
    firstVisitAt: iso(stats.firstVisitAt),
    favoriteStaff: stats.favoriteStaff,
    bookings: client.bookings.map((b) => ({
      id: b.id,
      publicCode: b.publicCode,
      startsAt: b.startDatetime.toISOString(),
      serviceName: b.serviceNameSnapshot,
      staffName: b.staff?.name ?? "—",
      priceArs: b.priceArs,
      status: b.status,
      upcoming: b.startDatetime > now,
    })),
    notes: client.notes.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt.toISOString() })),
    resultPhotos: photos.map((p) => ({ id: p.id, url: p.secureUrl, kind: p.kind })),
  };
}
