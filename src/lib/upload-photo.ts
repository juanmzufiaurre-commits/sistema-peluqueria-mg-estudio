// Solo para el navegador: comprime a WebP (máx. 1080p) y sube directo a Cloudinary con firma del servidor.

export const MAX_INPUT_BYTES = 12 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // límite de subida de Cloudinary (plan gratis)
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

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
  resourceType: "image" | "video";
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

/** Comprime a WebP y sube directo a Cloudinary con una firma pedida a `signEndpoint`. */
export async function uploadPhoto(file: File, signEndpoint: string): Promise<UploadedPhoto> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Usá fotos JPG, PNG o WebP");
  if (file.size > MAX_INPUT_BYTES) throw new Error("La foto pesa demasiado (máx. 12 MB)");

  const blob = await compressToWebp(file);
  return uploadSigned(blob, "referencia.webp", signEndpoint, "No pudimos subir la foto. Probá de nuevo.");
}

/** Sube un video tal cual (Cloudinary lo optimiza al entregarlo) con una firma pedida a `signEndpoint`. */
export async function uploadVideo(file: File, signEndpoint: string): Promise<UploadedPhoto> {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) throw new Error("Usá videos MP4, MOV o WebM");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("El video pesa demasiado (máx. 100 MB)");
  return uploadSigned(file, file.name || "video.mp4", signEndpoint, "No pudimos subir el video. Probá de nuevo.");
}

async function uploadSigned(blob: Blob, filename: string, signEndpoint: string, failMessage: string): Promise<UploadedPhoto> {
  const signRes = await fetch(signEndpoint, { method: "POST" });
  if (signRes.status === 429) throw new Error("Demasiados intentos. Probá en unos minutos.");
  if (!signRes.ok) throw new Error("La carga de fotos no está disponible por ahora");
  const sign = (await signRes.json()) as SignResponse;

  const body = new FormData();
  body.append("file", blob, filename);
  body.append("api_key", sign.apiKey);
  body.append("timestamp", String(sign.timestamp));
  body.append("folder", sign.folder);
  body.append("allowed_formats", sign.allowedFormats);
  body.append("signature", sign.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType}/upload`, { method: "POST", body });
  if (!res.ok) throw new Error(failMessage);
  const data = (await res.json()) as { secure_url: string; public_id: string };
  return { secureUrl: data.secure_url, publicId: data.public_id };
}

export const uploadReferencePhoto = (file: File): Promise<UploadedPhoto> => uploadPhoto(file, "/api/uploads/sign");
export const uploadResultPhoto = (file: File): Promise<UploadedPhoto> => uploadPhoto(file, "/api/admin/uploads/sign");
export const uploadStaffPhoto = (file: File): Promise<UploadedPhoto> => uploadPhoto(file, "/api/admin/uploads/sign?kind=staff");
export const uploadCatalogPhoto = (file: File): Promise<UploadedPhoto> => uploadPhoto(file, "/api/admin/uploads/sign?kind=catalog");
export const uploadCatalogVideo = (file: File): Promise<UploadedPhoto> => uploadVideo(file, "/api/admin/uploads/sign?kind=catalog&resource=video");
