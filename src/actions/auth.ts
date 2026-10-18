"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, type ActionResult } from "@/lib/action-result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminEmails } from "@/server/auth/admin";
import { devAdminEmail } from "@/server/auth/dev-admin";

const loginSchema = z.object({
  email: z.email("Ingresá un email válido").transform((e) => e.trim().toLowerCase()),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export async function loginAction(raw: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  // Mismo mensaje para todo fallo: no revelamos si el email existe o si es admin.
  const generic = "Email o contraseña incorrectos.";
  if (!adminEmails().includes(parsed.data.email)) return fail(generic);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail(generic);

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  if (devAdminEmail()) redirect("/"); // acceso de prueba: no hay sesión que cerrar
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
