import { Suspense, type ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/server/auth/admin";

export const metadata = { title: "Panel — MG Estudio", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // La sesión se lee en tiempo de request: todo el panel vive detrás de este Suspense.
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted">Cargando…</p>}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}

async function AdminFrame({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 lg:px-8">
        <div className="flex items-center gap-6">
          <span className="font-display text-3xl font-semibold leading-none">MG</span>
          <AdminNav />
        </div>
        <form action={logoutAction} className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{admin.email}</span>
          <button type="submit" className="rounded-sm px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-cream-deep">
            Salir
          </button>
        </form>
      </header>
      <div className="flex-1 px-4 py-6 lg:px-8">{children}</div>
    </div>
  );
}
