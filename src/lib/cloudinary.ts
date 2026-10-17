import { v2 as cloudinary } from "cloudinary";

export type UploadKind = "reference" | "result" | "staff" | "catalog";

export const FOLDERS: Record<UploadKind, string> = {
  reference: "mg-estudio/reference", // fotos que sube el cliente al reservar
  result: "mg-estudio/results", // fotos del resultado que sube el local
  staff: "mg-estudio/staff", // fotos de perfil de los profesionales
  catalog: "mg-estudio/catalog", // catálogo público de cortes
};
export const ALLOWED_FORMATS = "jpg,png,webp";

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
}

function credentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

/** Firma una subida directa desde el navegador. Devuelve null si Cloudinary no está configurado. */
export function signUpload(kind: UploadKind): UploadSignature | null {
  const c = credentials();
  if (!c) return null;

  const folder = FOLDERS[kind];
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder, allowed_formats: ALLOWED_FORMATS }, c.apiSecret);
  return { cloudName: c.cloudName, apiKey: c.apiKey, timestamp, folder, allowedFormats: ALLOWED_FORMATS, signature };
}

/**
 * Verifica que una foto reportada por el navegador sea realmente nuestra: de nuestra cuenta de
 * Cloudinary, dentro de la carpeta esperada y con una URL coherente con su public_id.
 * Evita que alguien asocie a un turno imágenes ajenas.
 */
export function isOwnAsset(cloudName: string, kind: UploadKind, photo: { secureUrl: string; publicId: string }): boolean {
  if (!photo.publicId.startsWith(`${FOLDERS[kind]}/`) || photo.publicId.includes("..")) return false;
  let url: URL;
  try {
    url = new URL(photo.secureUrl);
  } catch {
    return false;
  }
  const path = decodeURIComponent(url.pathname);
  return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && path.startsWith(`/${cloudName}/image/upload/`) && path.includes(`/${photo.publicId}.`);
}

/** Valida contra la cuenta configurada. Sin configuración nunca acepta nada. */
export function isOwnConfiguredAsset(kind: UploadKind, photo: { secureUrl: string; publicId: string }): boolean {
  const c = credentials();
  return c !== null && isOwnAsset(c.cloudName, kind, photo);
}

/** Borra el archivo en Cloudinary. Mejor esfuerzo: si falla, el turno no se ve afectado. */
export async function destroyAsset(publicId: string): Promise<boolean> {
  const c = credentials();
  if (!c) return false;
  try {
    cloudinary.config({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret, secure: true });
    const res = (await cloudinary.uploader.destroy(publicId, { invalidate: true })) as { result?: string };
    return res.result === "ok";
  } catch (error) {
    console.error("destroyAsset", error);
    return false;
  }
}
