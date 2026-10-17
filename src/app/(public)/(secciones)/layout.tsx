import { MapPin } from "lucide-react";
import { SectionNav } from "@/components/public/section-nav";
import { getPublicInfo } from "@/server/services/catalog";

/** Portada compartida por los tres apartados: logo, dirección y el menú Profesionales · Agendar turno · Catálogo. */
export default async function SectionsLayout({ children }: LayoutProps<"/">) {
  const info = await getPublicInfo();

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex min-h-[78svh] flex-col items-center px-4 text-center">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 pt-10">
          <h1 className="sr-only">{info.businessName}</h1>
          <p aria-hidden className="font-display text-[8rem] font-semibold leading-none tracking-tight sm:text-[11rem]">
            MG
          </p>
          <div aria-hidden className="-mt-2 flex flex-col items-center gap-3">
            <span className="label-wide">Estudio</span>
            <span className="label-wide text-muted">Design and style</span>
          </div>
          {info.address && (
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <MapPin aria-hidden className="size-4" strokeWidth={1.5} /> {info.address}
            </p>
          )}
        </div>
        <SectionNav />
      </header>

      {children}

      <footer className="border-t border-line px-4 py-8 text-center">
        <p className="label-wide text-muted">{info.businessName}</p>
      </footer>
    </main>
  );
}
