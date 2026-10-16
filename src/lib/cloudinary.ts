import { v2 as cloudinary } from "cloudinary";

export const UPLOAD_FOLDER = "mg-estudio/reference";
export const ALLOWED_FORMATS = "jpg,png,webp";

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
}

/** Firma una subida directa desde el navegador. Devuelve null si Cloudinary no está configurado. */
export function signReferenceUpload(): UploadSignature | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: UPLOAD_FOLDER, allowed_formats: ALLOWED_FORMATS },
    apiSecret,
  );
  return { cloudName, apiKey, timestamp, folder: UPLOAD_FOLDER, allowedFormats: ALLOWED_FORMATS, signature };
}
