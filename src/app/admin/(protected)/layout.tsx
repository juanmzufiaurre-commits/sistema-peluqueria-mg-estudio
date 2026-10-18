import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { AdminSideNav, AdminTabBar } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/server/auth/admin";
import { DEV_ADMIN_ID } from "@/server/auth/dev-admin";

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
  const devAccess = admin.id === DEV_ADMIN_ID;

  return (
    <div className="relative isolate flex min-h-dvh">
      {/* Brillo cálido de fondo, muy suave, para que el negro no quede plano */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_70%_-10%,rgb(243_234_224/0.06),transparent_70%)]" />

      {/* Menú lateral (compu) */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-ink/10 px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-8 flex items-baseline gap-3 px-3">
          <span className="font-display text-4xl font-semibold leading-none">MG</span>
          <span className="label-wide text-muted">Panel</span>
        </Link>
        <AdminSideNav />
        <div className="mt-auto flex flex-col gap-2 border-t border-ink/10 px-3 pt-5">
          {devAccess && <DevBadge />}
          <p className="truncate text-sm text-ink-soft" title={admin.email}>
            {admin.email}
          </p>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.15em] text-muted">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
              <ExternalLink aria-hidden className="size-3.5" /> Ver sitio
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center gap-1.5 uppercase transition-colors hover:text-ink">
                <LogOut aria-hidden className="size-3.5" /> Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior (celular) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-cream/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold leading-none">MG</span>
            <span className="label-wide text-muted">Panel</span>
          </Link>
          <div className="flex items-center gap-3">
            {devAccess && <DevBadge />}
            <form action={logoutAction}>
              <button type="submit" aria-label="Salir" className="flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:text-ink">
                <LogOut aria-hidden className="size-4" />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
      </div>

      <AdminTabBar />
    </div>
  );
}

function DevBadge() {
  return (
    <span className="w-fit rounded-sm border border-st-pending/50 px-2 py-1 text-[0.6rem] uppercase tracking-[0.15em] text-st-pending">Acceso de prueba</span>
  );
}
