import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminUser } from "@/server/auth/admin";

export const metadata: Metadata = { title: "Ingresar — MG Estudio", robots: { index: false } };

async function RedirectIfLoggedIn() {
  if (await getAdminUser()) redirect("/admin");
  return null;
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p aria-hidden className="font-display text-7xl font-semibold leading-none">
            MG
          </p>
          <p className="label-wide mt-3">Panel de administración</p>
        </div>
        <LoginForm />
      </div>
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
    </main>
  );
}
