import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEV_ADMIN_ID, devAdminEmail } from "./dev-admin";

export interface AdminUser {
  id: string;
  email: string;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Usuario autenticado Y presente en ADMIN_EMAILS, o null. Verifica el token contra Supabase Auth. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const dev = devAdminEmail(); // solo en `next dev` con DEV_ADMIN_EMAIL (ver dev-admin.ts)
  if (dev) {
    await connection(); // como la sesión real (que lee cookies): el panel se arma en cada request
    return { id: DEV_ADMIN_ID, email: dev };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (error || !data.user || !email) return null;
  return adminEmails().includes(email) ? { id: data.user.id, email } : null;
}

/** Para páginas del panel: sin sesión de admin, redirige al login. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}
