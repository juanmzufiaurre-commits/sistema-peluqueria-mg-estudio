import { db } from "@/lib/db";
import { addDaysToDateString, addMinutes, dayBoundsUtc, localDateString } from "@/lib/dates";
import { generateCancelToken, generatePublicCode, hashToken } from "@/lib/tokens";
import { BookingStatus, Prisma } from "@/generated/prisma/client";
import {
  computeAvailability,
  computeDaySlots,
  occupiedEnd,
  rankStaffByLoad,
  type AvailabilityConfig,
  type BusyInterval,
  type DaySlots,
  type StaffSchedule,
} from "./availability";

export const ACTIVE_STATUSES: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];

export type BookingErrorCode = "SERVICE_NOT_FOUND" | "SLOT_UNAVAILABLE" | "BOOKING_NOT_FOUND" | "BOOKING_NOT_ACTIVE" | "TOO_LATE";

export class BookingError extends Error {
  constructor(public readonly code: BookingErrorCode, message: string) {
    super(message);
    this.name = "BookingError";
  }
}

export interface CreateBookingInput {
  serviceId: string;
  startsAt: Date;
  client: { firstName: string; lastName: string; phoneE164: string };
  photos: { secureUrl: string; publicId: string }[];
}

export interface CreatedBooking {
  id: string;
  publicCode: string;
  /** Token en claro: se devuelve una sola vez; en la DB solo queda su hash. */
  cancelToken: string;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  staffId: string;
  serviceName: string;
  priceArs: number;
}

export async function loadConfig(): Promise<AvailabilityConfig & { minCancelHours: number }> {
  const c = await db.systemConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return {
    timezone: c.timezone,
    bufferMinutes: c.bufferMinutes,
    slotStepMinutes: c.slotStepMinutes,
    bookingWindowDays: c.bookingWindowDays,
    sameDayCutoffTime: c.sameDayCutoffTime,
    minCancelHours: c.minCancelHours,
  };
}

/** Profesionales activos con su horario: el propio o, si no tienen, el general del local. */
export async function loadStaffSchedules(): Promise<StaffSchedule[]> {
  const [staff, allHours] = await Promise.all([
    db.staff.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.workingHour.findMany(),
  ]);
  const toRange = (h: { weekday: number; startTime: string; endTime: string }) => ({
    weekday: h.weekday,
    start: h.startTime,
    end: h.endTime,
  });
  const global = allHours.filter((h) => h.staffId === null).map(toRange);

  return staff.map((s) => {
    const own = allHours.filter((h) => h.staffId === s.id).map(toRange);
    return { id: s.id, sortOrder: s.sortOrder, hours: own.length > 0 ? own : global };
  });
}

/** Turnos activos y bloqueos manuales que pisan el rango [from, to). */
async function loadBusy(from: Date, to: Date, excludeBookingId?: string): Promise<{ busy: BusyInterval[]; bookingStaff: { staffId: string; start: Date }[] }> {
  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        startDatetime: { lt: to },
        endDatetime: { gt: from },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { staffId: true, startDatetime: true, endDatetime: true },
    }),
    db.blockedPeriod.findMany({ where: { startDatetime: { lt: to }, endDatetime: { gt: from } } }),
  ]);
  return {
    busy: [
      ...bookings.map((b) => ({ staffId: b.staffId, start: b.startDatetime, end: b.endDatetime })),
      ...blocks.map((b) => ({ staffId: b.staffId, start: b.startDatetime, end: b.endDatetime })),
    ],
    bookingStaff: bookings.map((b) => ({ staffId: b.staffId, start: b.startDatetime })),
  };
}

/** Horarios libres de toda la ventana de reservas para un servicio. */
export async function getAvailability(serviceId: string, now: Date = new Date()): Promise<DaySlots[]> {
  const [service, config, staff] = await Promise.all([
    db.service.findFirst({ where: { id: serviceId, isActive: true } }),
    loadConfig(),
    loadStaffSchedules(),
  ]);
  if (!service) throw new BookingError("SERVICE_NOT_FOUND", "El servicio no existe o ya no está disponible.");

  const today = localDateString(now, config.timezone);
  const from = dayBoundsUtc(today, config.timezone).start;
  const to = dayBoundsUtc(addDaysToDateString(today, config.bookingWindowDays - 1), config.timezone).end;
  const { busy } = await loadBusy(from, to);

  return computeAvailability({ now, durationMinutes: service.durationMinutes, config, staff, busy });
}

/** Detecta la violación de la restricción anti-solapamiento (SQLSTATE 23P01). */
export function isOverlapViolation(error: unknown): boolean {
  const text = [
    error instanceof Error ? error.message : "",
    error instanceof Prisma.PrismaClientKnownRequestError ? JSON.stringify(error.meta ?? {}) : "",
    error instanceof Error && "cause" in error ? JSON.stringify(error.cause, Object.getOwnPropertyNames(Object(error.cause))) : "",
  ].join(" ");
  return text.includes("booking_no_overlap") || text.includes("23P01");
}

/**
 * Crea el turno asignando automáticamente al profesional libre con menos carga ese día.
 * La integridad final la garantiza la restricción EXCLUDE de la base: si dos clientes
 * reservan a la vez, la segunda inserción falla y se prueba con otro profesional.
 */
export async function createBooking(input: CreateBookingInput, now: Date = new Date()): Promise<CreatedBooking> {
  const [service, config, staff] = await Promise.all([
    db.service.findFirst({ where: { id: input.serviceId, isActive: true } }),
    loadConfig(),
    loadStaffSchedules(),
  ]);
  if (!service) throw new BookingError("SERVICE_NOT_FOUND", "El servicio no existe o ya no está disponible.");

  const date = localDateString(input.startsAt, config.timezone);
  const { start: dayStart, end: dayEnd } = dayBoundsUtc(date, config.timezone);
  const { busy, bookingStaff } = await loadBusy(dayStart, dayEnd);

  const slot = computeDaySlots({ date, now, durationMinutes: service.durationMinutes, config, staff, busy }).find(
    (s) => s.startsAt.getTime() === input.startsAt.getTime(),
  );
  if (!slot) throw new BookingError("SLOT_UNAVAILABLE", "Ese horario ya no está disponible. Elegí otro.");

  const dayLoad = new Map<string, number>();
  for (const b of bookingStaff) dayLoad.set(b.staffId, (dayLoad.get(b.staffId) ?? 0) + 1);

  const endsAt = occupiedEnd(input.startsAt, service.durationMinutes, config.bufferMinutes);

  for (const staffId of rankStaffByLoad(slot.staffIds, dayLoad)) {
    const { token, hash } = generateCancelToken();
    try {
      const booking = await db.$transaction(async (tx) => {
        const client = await tx.client.upsert({
          where: { phoneE164: input.client.phoneE164 },
          update: { firstName: input.client.firstName, lastName: input.client.lastName },
          create: { phoneE164: input.client.phoneE164, firstName: input.client.firstName, lastName: input.client.lastName },
        });
        return tx.booking.create({
          data: {
            publicCode: generatePublicCode(),
            clientId: client.id,
            staffId,
            serviceId: service.id,
            serviceNameSnapshot: service.name,
            priceArs: service.priceArs,
            durationMinutes: service.durationMinutes,
            bufferMinutes: config.bufferMinutes,
            startDatetime: input.startsAt,
            endDatetime: endsAt,
            status: BookingStatus.CONFIRMED,
            cancelTokenHash: hash,
            photos: { create: input.photos.map((p) => ({ secureUrl: p.secureUrl, publicId: p.publicId })) },
          },
        });
      });
      return {
        id: booking.id,
        publicCode: booking.publicCode,
        cancelToken: token,
        startsAt: booking.startDatetime,
        endsAt: booking.endDatetime,
        durationMinutes: service.durationMinutes,
        staffId,
        serviceName: service.name,
        priceArs: service.priceArs,
      };
    } catch (error) {
      if (isOverlapViolation(error)) continue; // otro cliente tomó a este profesional: probamos con el siguiente
      throw error;
    }
  }

  throw new BookingError("SLOT_UNAVAILABLE", "Ese horario acaba de ser reservado. Elegí otro.");
}

// ───────────────────────── Cancelar y reprogramar ─────────────────────────

export interface BookingView {
  id: string;
  publicCode: string;
  status: BookingStatus;
  /** Nulo si el servicio fue eliminado del catálogo (el turno conserva su snapshot). */
  serviceId: string | null;
  serviceName: string;
  firstName: string;
  startsAt: Date;
  durationMinutes: number;
  priceArs: number;
  /** El cliente puede cancelar/reprogramar solo hasta `minCancelHours` antes del turno. */
  canModify: boolean;
  minCancelHours: number;
}

const tokenWhere = (token: string) => ({ cancelTokenHash: hashToken(token) });

export async function getBookingByToken(token: string, now: Date = new Date()): Promise<BookingView | null> {
  if (token.length < 16 || token.length > 128) return null;
  const [b, config] = await Promise.all([
    db.booking.findUnique({ where: tokenWhere(token), include: { client: true } }),
    loadConfig(),
  ]);
  if (!b) return null;

  const active = (ACTIVE_STATUSES as string[]).includes(b.status);
  const limit = addMinutes(b.startDatetime, -config.minCancelHours * 60);
  return {
    id: b.id,
    publicCode: b.publicCode,
    status: b.status,
    serviceId: b.serviceId,
    serviceName: b.serviceNameSnapshot,
    firstName: b.client.firstName,
    startsAt: b.startDatetime,
    durationMinutes: b.durationMinutes,
    priceArs: b.priceArs,
    canModify: active && now < limit,
    minCancelHours: config.minCancelHours,
  };
}

/** Carga el turno del token y valida que esté activo y dentro de la ventana mínima. */
async function loadModifiable(token: string, now: Date) {
  const view = await getBookingByToken(token, now);
  if (!view) throw new BookingError("BOOKING_NOT_FOUND", "No encontramos ese turno.");
  if (!(ACTIVE_STATUSES as string[]).includes(view.status)) throw new BookingError("BOOKING_NOT_ACTIVE", "Ese turno ya no está activo.");
  if (!view.canModify)
    throw new BookingError("TOO_LATE", `Solo se puede modificar hasta ${view.minCancelHours} h antes del turno. Escribinos por WhatsApp para coordinar.`);
  return view;
}

export async function cancelBookingByClient(token: string, now: Date = new Date()): Promise<void> {
  const view = await loadModifiable(token, now);
  await db.booking.update({ where: { id: view.id }, data: { status: BookingStatus.CANCELLED_BY_CLIENT, cancelledAt: now } });
}

/** Horarios libres para mover un turno existente (el propio turno no cuenta como ocupado). */
export async function getRescheduleAvailability(token: string, now: Date = new Date()): Promise<DaySlots[]> {
  const view = await loadModifiable(token, now);
  return getAvailabilityFor(view.id, view.durationMinutes, now, false);
}

async function getAvailabilityFor(bookingId: string, durationMinutes: number, now: Date, adminMode: boolean): Promise<DaySlots[]> {
  const [config, staff] = await Promise.all([loadConfig(), loadStaffSchedules()]);
  const today = localDateString(now, config.timezone);
  const span = adminMode ? 60 : config.bookingWindowDays;
  const from = dayBoundsUtc(today, config.timezone).start;
  const to = dayBoundsUtc(addDaysToDateString(today, span - 1), config.timezone).end;
  const { busy } = await loadBusy(from, to, bookingId);
  const cfg = { ...config, bookingWindowDays: span };
  return computeAvailability({ now, durationMinutes, config: cfg, staff, busy, adminMode });
}

async function moveBooking(bookingId: string, durationMinutes: number, currentStaffId: string, startsAt: Date, now: Date, adminMode: boolean) {
  const [config, staff] = await Promise.all([loadConfig(), loadStaffSchedules()]);
  const date = localDateString(startsAt, config.timezone);
  const { start: dayStart, end: dayEnd } = dayBoundsUtc(date, config.timezone);
  const { busy, bookingStaff } = await loadBusy(dayStart, dayEnd, bookingId);

  const slot = computeDaySlots({ date, now, durationMinutes, config, staff, busy, adminMode }).find((s) => s.startsAt.getTime() === startsAt.getTime());
  if (!slot) throw new BookingError("SLOT_UNAVAILABLE", "Ese horario ya no está disponible. Elegí otro.");

  const dayLoad = new Map<string, number>();
  for (const b of bookingStaff) dayLoad.set(b.staffId, (dayLoad.get(b.staffId) ?? 0) + 1);
  // Preferimos mantener al mismo profesional si sigue libre.
  const ranked = rankStaffByLoad(slot.staffIds, dayLoad);
  const order = ranked.includes(currentStaffId) ? [currentStaffId, ...ranked.filter((id) => id !== currentStaffId)] : ranked;
  const endsAt = occupiedEnd(startsAt, durationMinutes, config.bufferMinutes);

  for (const staffId of order) {
    try {
      return await db.booking.update({
        where: { id: bookingId },
        data: { staffId, startDatetime: startsAt, endDatetime: endsAt, bufferMinutes: config.bufferMinutes },
      });
    } catch (error) {
      if (isOverlapViolation(error)) continue;
      throw error;
    }
  }
  throw new BookingError("SLOT_UNAVAILABLE", "Ese horario acaba de ser reservado. Elegí otro.");
}

export async function rescheduleBookingByClient(token: string, startsAt: Date, now: Date = new Date()) {
  const view = await loadModifiable(token, now);
  const current = await db.booking.findUniqueOrThrow({ where: { id: view.id }, select: { staffId: true } });
  return moveBooking(view.id, view.durationMinutes, current.staffId, startsAt, now, false);
}

export async function getAdminSlots(bookingId: string, date: string, now: Date = new Date()): Promise<Date[]> {
  const b = await db.booking.findUnique({ where: { id: bookingId }, select: { durationMinutes: true } });
  if (!b) throw new BookingError("BOOKING_NOT_FOUND", "El turno no existe.");
  const days = await getAvailabilityFor(bookingId, b.durationMinutes, now, true);
  return days.find((d) => d.date === date)?.slots.map((s) => s.startsAt) ?? [];
}

export async function rescheduleBookingByAdmin(bookingId: string, startsAt: Date, now: Date = new Date()) {
  const b = await db.booking.findUnique({ where: { id: bookingId } });
  if (!b) throw new BookingError("BOOKING_NOT_FOUND", "El turno no existe.");
  if (!(ACTIVE_STATUSES as string[]).includes(b.status)) throw new BookingError("BOOKING_NOT_ACTIVE", "Solo se pueden reprogramar turnos activos.");
  return moveBooking(b.id, b.durationMinutes, b.staffId, startsAt, now, true);
}
