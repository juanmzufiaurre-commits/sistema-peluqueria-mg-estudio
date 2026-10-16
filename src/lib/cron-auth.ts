import { createHash, timingSafeEqual } from "node:crypto";

const digest = (s: string): Buffer => createHash("sha256").update(s).digest();

/**
 * Verifica `Authorization: Bearer <CRON_SECRET>` en tiempo constante.
 * Devuelve el código HTTP a responder, o null si está autorizado.
 */
export function checkCronAuth(request: Request): 401 | 503 | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return 503; // sin secreto configurado, el endpoint queda cerrado
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  return timingSafeEqual(digest(provided), digest(secret)) ? null : 401;
}
