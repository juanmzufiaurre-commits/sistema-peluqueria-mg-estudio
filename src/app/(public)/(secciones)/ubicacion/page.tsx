import { ArrowUpRight, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getPublicInfo } from "@/server/services/catalog";

export const metadata = { title: "Ubicación — MG Estudio" };

/** Búsqueda de Google Maps: abre la app de mapas en el celular y la web en la compu. */
const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export default async function LocationPage() {
  const info = await getPublicInfo();

  return (
    <section className="section-enter mx-auto w-full max-w-xl px-4 pb-24 pt-12">
      <div className="flex flex-col items-center gap-6 rounded-sm border border-ink/10 bg-gradient-to-b from-ink/[0.06] to-ink/[0.015] px-6 py-12 text-center shadow-[inset_0_1px_0_rgb(243_234_224/0.06)]">
        <MapPin aria-hidden strokeWidth={1.2} className="size-9 text-ink" />

        {info.address ? (
          <>
            <div className="flex flex-col gap-3">
              <p className="label-wide text-muted">Nos encontrás en:</p>
              <p className="text-2xl font-medium leading-snug tracking-tight">{info.address}</p>
            </div>
            <a href={mapsUrl(info.address)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg" })}>
              Ver en el mapa <ArrowUpRight aria-hidden className="size-4" />
            </a>
          </>
        ) : (
          <p className="max-w-xs text-ink-soft">Muy pronto vas a encontrar acá nuestra dirección.</p>
        )}
      </div>
    </section>
  );
}
