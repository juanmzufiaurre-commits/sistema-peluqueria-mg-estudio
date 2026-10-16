import { MapPin } from "lucide-react";
import { BookingWizard } from "@/components/booking/wizard";
import { ButtonLink } from "@/components/ui/button";
import { getActiveServices, getPublicInfo } from "@/server/services/catalog";

export default async function HomePage() {
  const [services, info] = await Promise.all([getActiveServices(), getPublicInfo()]);

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex min-h-[78svh] flex-col items-center justify-center gap-6 px-6 text-center">
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
        <ButtonLink href="#reservar" size="lg" className="mt-4">
          Reservar turno
        </ButtonLink>
      </header>

      <section id="reservar" className="mx-auto w-full max-w-xl scroll-mt-4 px-4 pb-24 pt-12">
        <BookingWizard services={services} info={info} />
      </section>

      <footer className="border-t border-line px-4 py-8 text-center">
        <p className="label-wide text-muted">{info.businessName}</p>
      </footer>
    </main>
  );
}
