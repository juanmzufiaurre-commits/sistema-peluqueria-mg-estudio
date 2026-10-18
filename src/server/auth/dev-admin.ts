/**
 * Acceso de prueba al panel SOLO para desarrollo local (`next dev`), para trabajar sin Supabase:
 * con DEV_ADMIN_EMAIL en el .env se entra a /admin sin login, como ese email.
 * En producción (`next build` / `next start`, Vercel) NODE_ENV es "production" y esto nunca se activa,
 * aunque la variable exista. Sin imports a propósito: lo usa también el proxy.
 */
export function devAdminEmail(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  return process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase() || null;
}

export const DEV_ADMIN_ID = "dev-admin";
