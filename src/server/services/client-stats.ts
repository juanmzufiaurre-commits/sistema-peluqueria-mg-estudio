import { ACTIVE, type BookingStatusValue } from "@/lib/booking-status";

// Cálculos puros de la base de clientes (sin base de datos), para poder testearlos.

/** Días sin venir a partir de los cuales un cliente habitual pasa a "para recuperar". */
export const INACTIVE_DAYS = 60;
/** Visitas completadas a partir de las cuales un cliente cuenta como habitual. */
export const REGULAR_VISITS = 3;

export interface ClientBooking {
  startsAt: Date;
  status: BookingStatusValue;
  priceArs: number;
  serviceName: string;
  staffName: string | null;
}

export interface ClientStats {
  visits: number; // turnos completados
  noShows: number;
  cancellations: number;
  spentArs: number; // suma de los turnos completados
  firstBookingAt: Date | null; // su primer turno, en cualquier estado
  firstVisitAt: Date | null;
  lastVisitAt: Date | null;
  nextBookingAt: Date | null; // próximo turno activo
  favoriteService: string | null;
  favoriteStaff: string | null;
}

const DAY_MS = 86_400_000;

function mostFrequent(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | null = null;
  let max = 0;
  for (const [v, n] of counts) if (n > max) [best, max] = [v, n];
  return best;
}

export function clientStats(bookings: ClientBooking[], now: Date): ClientStats {
  const done = bookings.filter((b) => b.status === "COMPLETED").sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const upcoming = bookings
    .filter((b) => (ACTIVE as readonly string[]).includes(b.status) && b.startsAt >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return {
    visits: done.length,
    noShows: bookings.filter((b) => b.status === "NO_SHOW").length,
    cancellations: bookings.filter((b) => b.status === "CANCELLED_BY_CLIENT" || b.status === "CANCELLED_BY_ADMIN").length,
    spentArs: done.reduce((sum, b) => sum + b.priceArs, 0),
    firstBookingAt: bookings.reduce<Date | null>((min, b) => (min === null || b.startsAt < min ? b.startsAt : min), null),
    firstVisitAt: done[0]?.startsAt ?? null,
    lastVisitAt: done.at(-1)?.startsAt ?? null,
    nextBookingAt: upcoming[0]?.startsAt ?? null,
    favoriteService: mostFrequent(done.map((b) => b.serviceName)),
    favoriteStaff: mostFrequent(done.flatMap((b) => (b.staffName ? [b.staffName] : []))),
  };
}

/** Días enteros desde la última visita (null si nunca vino). */
export const daysSinceLastVisit = (s: ClientStats, now: Date): number | null =>
  s.lastVisitAt ? Math.floor((now.getTime() - s.lastVisitAt.getTime()) / DAY_MS) : null;

/** Vino alguna vez, no tiene turno reservado y hace más de INACTIVE_DAYS que no viene. */
export function isInactive(s: ClientStats, now: Date): boolean {
  const days = daysSinceLastVisit(s, now);
  return days !== null && days > INACTIVE_DAYS && s.nextBookingAt === null;
}

const normalize = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Búsqueda por nombre (sin importar tildes ni mayúsculas) o por parte del teléfono. */
export function matchesQuery(c: { firstName: string; lastName: string | null; phoneE164: string }, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 3 && digits.length === q.replace(/[\s()+-]/g, "").length) return c.phoneE164.includes(digits);
  const name = normalize(`${c.firstName} ${c.lastName ?? ""}`);
  return q.split(/\s+/).every((term) => name.includes(term));
}

export type ClientSort = "recientes" | "visitas" | "nombre" | "recuperar";
export const CLIENT_SORTS: ClientSort[] = ["recientes", "visitas", "nombre", "recuperar"];
export const isClientSort = (s: unknown): s is ClientSort => typeof s === "string" && (CLIENT_SORTS as string[]).includes(s);

interface Sortable {
  firstName: string;
  lastName: string | null;
  createdAt: Date;
  stats: ClientStats;
}

const lastActivity = (c: Sortable): number =>
  Math.max(c.createdAt.getTime(), c.stats.lastVisitAt?.getTime() ?? 0, c.stats.nextBookingAt?.getTime() ?? 0);

/** Ordena (y en "recuperar", filtra) la lista de clientes. No modifica el arreglo original. */
export function sortClients<T extends Sortable>(rows: T[], sort: ClientSort, now: Date): T[] {
  const byName = (a: T, b: T) => `${a.firstName} ${a.lastName ?? ""}`.localeCompare(`${b.firstName} ${b.lastName ?? ""}`, "es");
  switch (sort) {
    case "visitas":
      return [...rows].sort((a, b) => b.stats.visits - a.stats.visits || b.stats.spentArs - a.stats.spentArs || byName(a, b));
    case "nombre":
      return [...rows].sort(byName);
    case "recuperar":
      // Los que hace más tiempo que no vienen, primero.
      return rows
        .filter((r) => isInactive(r.stats, now))
        .sort((a, b) => (a.stats.lastVisitAt?.getTime() ?? 0) - (b.stats.lastVisitAt?.getTime() ?? 0));
    case "recientes":
      return [...rows].sort((a, b) => lastActivity(b) - lastActivity(a));
  }
}
