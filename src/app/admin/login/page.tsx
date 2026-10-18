import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { HeroVideo } from "@/components/public/hero-video";
import { getAdminUser } from "@/server/auth/admin";

export const metadata: Metadata = { title: "Ingresar — MG Estudio", robots: { index: false } };

async function RedirectIfLoggedIn() {
  if (await getAdminUser()) redirect("/admin");
  return null;
}

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-dvh flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {/* El mismo video de la portada, oscurecido, detrás de la tarjeta */}
      <HeroVideo intro={false} instant />
      <div className="surface-card w-full max-w-sm bg-cream/60 p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p aria-hidden className="font-display text-7xl font-semibold leading-none">
            MG
          </p>
          <p className="label-wide mt-3 text-ink-soft">Panel de administración</p>
        </div>
        <LoginForm />
      </div>
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
    </main>
  );
}
