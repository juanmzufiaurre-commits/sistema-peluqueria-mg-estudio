// Solo para el navegador: comprime a WebP (máx. 1080p) y sube directo a Cloudinary con firma del servidor.

export const MAX_INPUT_BYTES = 12 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_LONG_SIDE = 1920;
const MAX_SHORT_SIDE = 1080;

export async function compressToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const long = Math.max(bitmap.width, bitmap.height);
  const short = Math.min(bitmap.width, bitmap.height);
  const scale = Math.min(1, MAX_LONG_SIDE / long, MAX_SHORT_SIDE / short);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen"))), "image/webp", 0.82),
  );
}

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
}

export interface UploadedPhoto {
  secureUrl: string;
  publicId: string;
}

export async function uploadReferencePhoto(file: File): Promise<UploadedPhoto> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Usá fotos JPG, PNG o WebP");
  if (file.size > MAX_INPUT_BYTES) throw new Error("La foto pesa demasiado (máx. 12 MB)");

  const blob = await compressToWebp(file);

  const signRes = await fetch("/api/uploads/sign", { method: "POST" });
  if (!signRes.ok) throw new Error("La carga de fotos no está disponible por ahora");
  const sign = (await signRes.json()) as SignResponse;

  const body = new FormData();
  body.append("file", blob, "referencia.webp");
  body.append("api_key", sign.apiKey);
  body.append("timestamp", String(sign.timestamp));
  body.append("folder", sign.folder);
  body.append("allowed_formats", sign.allowedFormats);
  body.append("signature", sign.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("No pudimos subir la foto. Probá de nuevo.");
  const data = (await res.json()) as { secure_url: string; public_id: string };
  return { secureUrl: data.secure_url, publicId: data.public_id };
}
