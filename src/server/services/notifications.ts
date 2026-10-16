import "server-only";
import { db } from "@/lib/db";
import { addMinutes, dayBoundsUtc, localDateString } from "@/lib/dates";
import { formatLongDate, formatTime } from "@/lib/format";
import { waMessage, type WaContext, type WaTemplate } from "@/lib/wa-links";
import { NotificationChannel, NotificationStatus, NotificationType, Prisma, type Booking, type Client } from "@/generated/prisma/client";
import { getWhatsAppProvider, type WhatsAppProvider } from "@/server/whatsapp/provider";
import { loadConfig } from "./booking";

type BookingWithClient = Booking & { client: Client };

export interface JobSummary {
  configured: boolean;
  candidates: number;
  sent: number;
  failed: number;
  skipped: number;
}

const TEMPLATE_FOR: Partial<Record<NotificationType, WaTemplate>> = {
  MORNING: "morning",
  ONE_HOUR_BEFORE: "proximity",
  CANCELLATION_BY_ADMIN: "cancellation",
};

async function contextFor(b: BookingWithClient): Promise<WaContext> {
  const info = await db.systemConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const iso = b.startDatetime.toISOString();
  return {
    firstName: b.client.firstName,
    dateLabel: formatLongDate(iso),
    timeLabel: formatTime(iso),
    serviceName: b.serviceNameSnapshot,
    businessName: info.businessName,
    address: info.address,
    rebookUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };
}

/**
 * Reserva el (turno, tipo) para que un aviso no se envíe dos veces aunque el cron corra en paralelo.
 * Un envío FALLIDO anterior se puede reintentar; uno enviado o en curso no.
 */
async function claim(bookingId: string, type: NotificationType): Promise<boolean> {
  try {
    await db.notificationLog.create({ data: { bookingId, type, channel: NotificationChannel.GATEWAY, status: NotificationStatus.PENDING } });
    return true;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const retried = await db.notificationLog.updateMany({
      where: { bookingId, type, status: NotificationStatus.FAILED },
      data: { status: NotificationStatus.PENDING, error: null },
    });
    return retried.count === 1;
  }
}

async function deliver(provider: WhatsAppProvider, b: BookingWithClient, type: NotificationType): Promise<boolean> {
  const template = TEMPLATE_FOR[type];
  if (!template) throw new Error(`Sin plantilla para ${type}`);
  if (!(await claim(b.id, type))) return false; // ya enviado o en curso

  const result = await provider.send(b.client.phoneE164, waMessage(template, await contextFor(b)));
  await db.notificationLog.update({
    where: { bookingId_type: { bookingId: b.id, type } },
    data: result.ok
      ? { status: NotificationStatus.SENT, sentAt: new Date(), providerId: result.providerId ?? null }
      : { status: NotificationStatus.FAILED, error: result.error ?? "Error desconocido" },
  });
  return result.ok;
}

async function runJob(type: NotificationType, bookings: BookingWithClient[]): Promise<JobSummary> {
  const provider = getWhatsAppProvider();
  const summary: JobSummary = { configured: provider !== null, candidates: bookings.length, sent: 0, failed: 0, skipped: 0 };
  if (!provider) return summary; // sin gateway no registramos nada: cuando se configure, los avisos pendientes salen

  for (const b of bookings) {
    const claimedBefore = await db.notificationLog.findUnique({ where: { bookingId_type: { bookingId: b.id, type } } });
    if (claimedBefore && claimedBefore.status !== NotificationStatus.FAILED) {
      summary.skipped++;
      continue;
    }
    if (await deliver(provider, b, type)) summary.sent++;
    else summary.failed++;
  }
  return summary;
}

/** Rutina matutina: turnos CONFIRMED de hoy que todavía no empezaron. */
export async function runMorningReminders(now: Date = new Date()): Promise<JobSummary> {
  const { timezone } = await loadConfig();
  const { start, end } = dayBoundsUtc(localDateString(now, timezone), timezone);
  const bookings = await db.booking.findMany({
    where: { status: "CONFIRMED", startDatetime: { gte: now > start ? now : start, lt: end } },
    include: { client: true },
    orderBy: { startDatetime: "asc" },
  });
  return runJob(NotificationType.MORNING, bookings);
}

/** Rutina de proximidad: turnos CONFIRMED que empiezan entre 50 y 75 minutos desde ahora. */
export async function runProximityReminders(now: Date = new Date()): Promise<JobSummary> {
  const bookings = await db.booking.findMany({
    where: { status: "CONFIRMED", startDatetime: { gte: addMinutes(now, 50), lte: addMinutes(now, 75) } },
    include: { client: true },
    orderBy: { startDatetime: "asc" },
  });
  return runJob(NotificationType.ONE_HOUR_BEFORE, bookings);
}

/** Aviso inmediato al cancelar el local. Devuelve true si salió por el gateway. */
export async function notifyCancellationByAdmin(bookingId: string): Promise<boolean> {
  const provider = getWhatsAppProvider();
  if (!provider) return false;
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { client: true } });
  if (!b) return false;
  return deliver(provider, b, NotificationType.CANCELLATION_BY_ADMIN);
}
