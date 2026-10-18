"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { destroyAsset, isOwnConfiguredAsset } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { catalogCaptionSchema } from "@/lib/validation/staff";
import { getAdminUser } from "@/server/auth/admin";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

function refresh() {
  updateTag("catalog"); // apartado público "Catálogo"
  revalidatePath("/admin/catalogo");
}

const addSchema = z.object({
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  secureUrl: z.url(),
  publicId: z.string().min(1).max(200),
  staffId: z.string().min(1).nullable(),
  serviceId: z.string().min(1).nullable(),
  caption: catalogCaptionSchema,
});

/** Agrega al catálogo una foto o un video ya subido a Cloudinary. */
export async function addCatalogPhotoAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = addSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { mediaType, secureUrl, publicId, staffId, serviceId, caption } = parsed.data;
  const resource = mediaType === "VIDEO" ? "video" : "image";
  if (!isOwnConfiguredAsset("catalog", { secureUrl, publicId }, resource)) return fail("El archivo no es válido.");

  try {
    await db.catalogPhoto.create({ data: { mediaType, secureUrl, publicId, staffId, serviceId, caption } });
  } catch {
    return fail("Ese archivo ya está cargado.");
  }
  refresh();
  return ok();
}

const updateSchema = z.object({
  id: z.string().min(1),
  staffId: z.string().min(1).nullable(),
  serviceId: z.string().min(1).nullable(),
  caption: catalogCaptionSchema,
});

export async function updateCatalogPhotoAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { id, staffId, serviceId, caption } = parsed.data;

  await db.catalogPhoto.update({ where: { id }, data: { staffId, serviceId, caption } });
  refresh();
  return ok();
}

/** Elimina la foto o el video del catálogo (fila y archivo en Cloudinary). */
export async function deleteCatalogPhotoAction(photoId: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const id = z.string().min(1).safeParse(photoId);
  if (!id.success) return fail("Foto inválida");

  const photo = await db.catalogPhoto.findUnique({ where: { id: id.data } });
  if (!photo) return fail("La foto no existe.");

  await db.catalogPhoto.delete({ where: { id: photo.id } });
  await destroyAsset(photo.publicId, photo.mediaType === "VIDEO" ? "video" : "image"); // si falla, ya no aparece igual
  refresh();
  return ok();
}
