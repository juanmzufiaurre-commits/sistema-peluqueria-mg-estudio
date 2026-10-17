"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { destroyAsset, isOwnConfiguredAsset } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { staffProfileSchema } from "@/lib/validation/staff";
import { getAdminUser } from "@/server/auth/admin";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

function refresh() {
  updateTag("team"); // apartado público "Profesionales"
  updateTag("catalog"); // el catálogo muestra el nombre de quién hizo cada corte
  revalidatePath("/admin/equipo");
}

export async function updateStaffProfileAction(id: unknown, raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  if (typeof id !== "string" || !id) return fail("Profesional inválido");
  const parsed = staffProfileSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  await db.staff.update({ where: { id }, data: parsed.data });
  refresh();
  return ok();
}

const photoSchema = z.object({
  staffId: z.string().min(1),
  secureUrl: z.url(),
  publicId: z.string().min(1).max(200),
});

/** Reemplaza la foto de perfil (ya subida a Cloudinary) y borra la anterior. */
export async function setStaffPhotoAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = photoSchema.safeParse(raw);
  if (!parsed.success) return fail("Datos inválidos");
  const { staffId, secureUrl, publicId } = parsed.data;
  if (!isOwnConfiguredAsset("staff", { secureUrl, publicId })) return fail("La foto no es válida.");

  const staff = await db.staff.findUnique({ where: { id: staffId }, select: { photoPublicId: true } });
  if (!staff) return fail("El profesional no existe.");

  await db.staff.update({ where: { id: staffId }, data: { photoUrl: secureUrl, photoPublicId: publicId } });
  if (staff.photoPublicId) await destroyAsset(staff.photoPublicId);
  refresh();
  return ok();
}

export async function removeStaffPhotoAction(staffId: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const id = z.string().min(1).safeParse(staffId);
  if (!id.success) return fail("Profesional inválido");

  const staff = await db.staff.findUnique({ where: { id: id.data }, select: { photoPublicId: true } });
  if (!staff) return fail("El profesional no existe.");

  await db.staff.update({ where: { id: id.data }, data: { photoUrl: null, photoPublicId: null } });
  if (staff.photoPublicId) await destroyAsset(staff.photoPublicId);
  refresh();
  return ok();
}
