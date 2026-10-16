"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { serviceSchema } from "@/lib/validation/service";
import { getAdminUser } from "@/server/auth/admin";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

function refresh() {
  updateTag("services"); // el wizard público lee la lista cacheada con este tag
  revalidatePath("/admin/servicios");
}

export async function createServiceAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const last = await db.service.aggregate({ _max: { sortOrder: true } });
  await db.service.create({ data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  refresh();
  return ok();
}

export async function updateServiceAction(id: unknown, raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  if (typeof id !== "string" || !id) return fail("Servicio inválido");
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  // Los turnos ya creados guardan su propio snapshot de precio y duración: editar no los altera.
  await db.service.update({ where: { id }, data: parsed.data });
  refresh();
  return ok();
}

const activeSchema = z.object({ id: z.string().min(1), isActive: z.boolean() });

/** Baja lógica: nunca se borra un servicio, para no romper el historial ni las métricas. */
export async function setServiceActiveAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = activeSchema.safeParse(raw);
  if (!parsed.success) return fail("Datos inválidos");

  await db.service.update({ where: { id: parsed.data.id }, data: { isActive: parsed.data.isActive } });
  refresh();
  return ok();
}
