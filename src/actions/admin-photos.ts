"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { destroyAsset, isOwnConfiguredAsset } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { MAX_RESULT_PHOTOS } from "@/lib/photo-limits";
import { getAdminUser } from "@/server/auth/admin";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

const addSchema = z.object({
  bookingId: z.string().min(1),
  secureUrl: z.url(),
  publicId: z.string().min(1).max(200),
});

/** Asocia una foto del resultado (ya subida a Cloudinary) a un turno. */
export async function addResultPhotoAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = addSchema.safeParse(raw);
  if (!parsed.success) return fail("Datos inválidos");
  const { bookingId, secureUrl, publicId } = parsed.data;

  if (!isOwnConfiguredAsset("result", { secureUrl, publicId })) return fail("La foto no es válida.");

  const [booking, count] = await Promise.all([
    db.booking.findUnique({ where: { id: bookingId }, select: { id: true } }),
    db.bookingPhoto.count({ where: { bookingId, kind: "RESULT" } }),
  ]);
  if (!booking) return fail("El turno no existe.");
  if (count >= MAX_RESULT_PHOTOS) return fail(`Máximo ${MAX_RESULT_PHOTOS} fotos de resultado por turno.`);

  try {
    await db.bookingPhoto.create({ data: { bookingId, kind: "RESULT", secureUrl, publicId } });
  } catch {
    return fail("Esa foto ya está cargada.");
  }
  revalidatePath("/admin");
  return ok();
}

/** Elimina una foto del resultado (fila y archivo en Cloudinary). Las de referencia del cliente no se tocan. */
export async function deleteResultPhotoAction(photoId: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const id = z.string().min(1).safeParse(photoId);
  if (!id.success) return fail("Foto inválida");

  const photo = await db.bookingPhoto.findUnique({ where: { id: id.data } });
  if (!photo) return fail("La foto no existe.");
  if (photo.kind !== "RESULT") return fail("Solo se pueden eliminar fotos del resultado.");

  await db.bookingPhoto.delete({ where: { id: photo.id } });
  await destroyAsset(photo.publicId); // si falla, la foto ya no aparece igual
  revalidatePath("/admin");
  return ok();
}
