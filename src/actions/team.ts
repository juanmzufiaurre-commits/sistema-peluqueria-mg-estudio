"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { destroyAsset, isOwnConfiguredAsset } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { staffNameSchema, staffProfileSchema } from "@/lib/validation/staff";
import { getAdminUser } from "@/server/auth/admin";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

function refresh() {
  updateTag("team"); // apartado público "Profesionales"
  updateTag("catalog"); // el catálogo muestra el nombre de quién hizo cada corte
  revalidatePath("/admin/equipo");
  revalidatePath("/admin/catalogo"); // selector de "quién hizo el corte"
}

export async function updateStaffProfileAction(id: unknown, raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  if (typeof id !== "string" || !id) return fail("Profesional inválido");
  const parsed = staffProfileSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const { certificates, ...profile } = parsed.data;
  // Los certificados se reemplazan completos: es la lista tal cual quedó en el formulario.
  await db.$transaction([
    db.staff.update({ where: { id }, data: profile }),
    db.staffCertificate.deleteMany({ where: { staffId: id } }),
    db.staffCertificate.createMany({ data: certificates.map((c, i) => ({ ...c, staffId: id, sortOrder: i })) }),
  ]);
  refresh();
  return ok();
}

/** Suma un profesional al equipo. Atiende con el horario general del local hasta que se le cargue uno propio. */
export async function createStaffAction(rawName: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const name = staffNameSchema.safeParse(rawName);
  if (!name.success) return fail(name.error.issues[0]?.message ?? "Nombre inválido");

  const last = await db.staff.aggregate({ _max: { sortOrder: true } });
  await db.staff.create({ data: { name: name.data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  refresh();
  return ok();
}

/**
 * Quita a un profesional del equipo (baja lógica): deja de verse en la página y de recibir reservas.
 * Sus turnos (pasados y ya agendados) se conservan en la agenda. Siempre queda al menos uno.
 */
export async function removeStaffAction(staffId: unknown): Promise<ActionResult<{ upcoming: number }>> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const id = z.string().min(1).safeParse(staffId);
  if (!id.success) return fail("Profesional inválido");

  const active = await db.staff.count({ where: { isActive: true } });
  if (active <= 1) return fail("Tiene que quedar al menos un profesional en el equipo.");

  const upcoming = await db.booking.count({
    where: { staffId: id.data, startDatetime: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
  });
  await db.staff.update({ where: { id: id.data }, data: { isActive: false } });
  refresh();
  return ok({ upcoming });
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
