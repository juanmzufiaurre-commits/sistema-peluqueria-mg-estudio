import { HeroShell } from "@/components/public/hero-shell";
import { getPublicInfo } from "@/server/services/catalog";

const INTRO_SEEN_SCRIPT = `try{sessionStorage.getItem("mg-intro-seen")==="1"&&document.documentElement.setAttribute("data-intro-seen","")}catch(e){}`;

/** Portada compartida por los tres apartados: intro con video, logo y el menú Profesionales · Agendar turno · Catálogo. */
export default async function SectionsLayout({ children }: LayoutProps<"/">) {
  const info = await getPublicInfo();

  return (
    <main className="flex flex-1 flex-col">
      {/* Antes de pintar: si la intro ya se vio en esta visita, la portada arranca acomodada (ver globals.css). */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
      <HeroShell businessName={info.businessName} address={info.address}>
        {children}
      </HeroShell>

      <footer className="border-t border-line px-4 py-8 text-center">
        <p className="label-wide text-muted">{info.businessName}</p>
      </footer>
    </main>
  );
}
