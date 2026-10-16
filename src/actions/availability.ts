"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { BookingError, getAvailability } from "@/server/services/booking";

export interface AvailableDay {
  date: string; // yyyy-MM-dd
  /** Horarios libres en ISO UTC. Vacío = día deshabilitado en el calendario. */
  slots: string[];
}

export async function getAvailabilityAction(serviceId: string): Promise<ActionResult<AvailableDay[]>> {
  try {
    const days = await getAvailability(serviceId);
    return ok(days.map((d) => ({ date: d.date, slots: d.slots.map((s) => s.startsAt.toISOString()) })));
  } catch (error) {
    if (error instanceof BookingError) return fail(error.message);
    console.error("getAvailabilityAction", error);
    return fail("No pudimos cargar los horarios. Probá de nuevo.");
  }
}
