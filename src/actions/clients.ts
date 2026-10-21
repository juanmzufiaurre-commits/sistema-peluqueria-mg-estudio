"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { getAdminUser } from "@/server/auth/admin";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

const nameSchema = z.object({
  clientId: z.string().min(1),
  firstName: z.string().trim().min(1, "Escribí el nombre").max(60, "El nombre es demasiado largo"),
  lastName: z.string().trim().max(60, "El apellido es demasiado largo"),
});

/** Corrige el nombre de un cliente (por ejemplo, si lo escribió mal al reservar). El teléfono no se toca: es su clave. */
export async function updateClientNameAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = nameSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const { clientId, firstName, lastName } = parsed.data;
  const exists = await db.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!exists) return fail("El cliente no existe");

  await db.client.update({ where: { id: clientId }, data: { firstName, lastName: lastName || null } });
  revalidatePath("/admin/clientes", "layout");
  revalidatePath("/admin");
  return ok();
}
