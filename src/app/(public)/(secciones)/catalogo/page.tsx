import { CatalogGallery } from "@/components/public/catalog-gallery";
import { getCatalogPhotos } from "@/server/services/team";

export const metadata = { title: "Catálogo de cortes — MG Estudio" };

export default async function CatalogPage() {
  const photos = await getCatalogPhotos();

  return (
    <section className="section-enter mx-auto w-full max-w-5xl px-4 pb-24 pt-12">
      <div className="mb-10 text-center">
        <h2 className="font-display text-4xl font-semibold">Catálogo de cortes</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">Trabajos reales del estudio. Inspirate y, al reservar, subí la foto del que más te guste.</p>
      </div>
      <CatalogGallery photos={photos} />
    </section>
  );
}
