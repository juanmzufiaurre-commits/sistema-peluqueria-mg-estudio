import { HeroShell } from "@/components/public/hero-shell";
import { getPublicInfo } from "@/server/services/catalog";

/** Portada compartida por los tres apartados: intro con video, logo y el menú Profesionales · Agendar turno · Catálogo. */
export default async function SectionsLayout({ children }: LayoutProps<"/">) {
  const info = await getPublicInfo();

  return (
    <main className="relative isolate flex flex-1 flex-col">
      {/* Patrón de tijeras y navajas que se desvanece hacia arriba desde el pie */}
      <div aria-hidden className="tools-pattern pointer-events-none absolute inset-x-0 bottom-0 -z-10" />
      <HeroShell businessName={info.businessName} address={info.address}>
        {children}
      </HeroShell>

      <footer className="border-t border-line px-4 py-8 text-center">
        <p className="label-wide text-muted">{info.businessName}</p>
      </footer>
    </main>
  );
}
