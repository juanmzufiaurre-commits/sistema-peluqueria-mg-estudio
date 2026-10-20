"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isOwnConfiguredAsset } from "@/lib/cloudinary";
import { createBookingSchema } from "@/lib/validation/booking";
import { BookingError, createBooking } from "@/server/services/booking";

export interface BookingReceipt {
  publicCode: string;
  cancelToken: string;
  startsAt: string; // ISO UTC
  endsAt: string;
  durationMinutes: number;
  serviceName: string;
  staffName: string;
  priceArs: number;
}

export async function createBookingAction(raw: unknown): Promise<ActionResult<BookingReceipt>> {
  const parsed = createBookingSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const data = parsed.data;

  // Honeypot completado: es un bot. No damos pistas.
  if (data.website) return fail("No pudimos procesar la reserva.");

  // Solo aceptamos fotos que subimos nosotros a nuestra cuenta (no URLs ajenas).
  if (!data.photos.every((p) => isOwnConfiguredAsset("reference", p))) return fail("Alguna foto no es válida. Quitala y subila de nuevo.");

  try {
    const booking = await createBooking({
      serviceId: data.serviceId,
      startsAt: new Date(data.startsAt),
      staffId: data.staffId ?? null,
      client: { firstName: data.firstName, lastName: data.lastName, phoneE164: data.phone },
      photos: data.photos,
    });
    return ok({
      publicCode: booking.publicCode,
      cancelToken: booking.cancelToken,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      durationMinutes: booking.durationMinutes,
      serviceName: booking.serviceName,
      staffName: booking.staffName,
      priceArs: booking.priceArs,
    });
  } catch (error) {
    if (error instanceof BookingError) return fail(error.message);
    console.error("createBookingAction", error);
    return fail("No pudimos crear tu turno. Probá de nuevo.");
  }
}
