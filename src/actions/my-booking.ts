"use server";

import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  BookingError,
  cancelBookingByClient,
  getRescheduleAvailability,
  rescheduleBookingByClient,
} from "@/server/services/booking";
import type { AvailableDay } from "./availability";

const tokenSchema = z.string().min(16).max(128);

function toFail(error: unknown, label: string): ActionResult<never> {
  if (error instanceof BookingError) return fail(error.message);
  console.error(label, error);
  return fail("Algo salió mal. Probá de nuevo.");
}

export async function getRescheduleAvailabilityAction(token: unknown): Promise<ActionResult<AvailableDay[]>> {
  const t = tokenSchema.safeParse(token);
  if (!t.success) return fail("Enlace inválido");
  try {
    const days = await getRescheduleAvailability(t.data);
    return ok(days.map((d) => ({ date: d.date, slots: d.slots.map((s) => s.startsAt.toISOString()) })));
  } catch (error) {
    return toFail(error, "getRescheduleAvailabilityAction");
  }
}

export async function cancelMyBookingAction(token: unknown): Promise<ActionResult> {
  const t = tokenSchema.safeParse(token);
  if (!t.success) return fail("Enlace inválido");
  try {
    await cancelBookingByClient(t.data);
    return ok();
  } catch (error) {
    return toFail(error, "cancelMyBookingAction");
  }
}

const rescheduleSchema = z.object({ token: tokenSchema, startsAt: z.iso.datetime() });

export async function rescheduleMyBookingAction(raw: unknown): Promise<ActionResult<{ startsAt: string }>> {
  const parsed = rescheduleSchema.safeParse(raw);
  if (!parsed.success) return fail("Datos inválidos");
  try {
    const b = await rescheduleBookingByClient(parsed.data.token, new Date(parsed.data.startsAt));
    return ok({ startsAt: b.startDatetime.toISOString() });
  } catch (error) {
    return toFail(error, "rescheduleMyBookingAction");
  }
}
