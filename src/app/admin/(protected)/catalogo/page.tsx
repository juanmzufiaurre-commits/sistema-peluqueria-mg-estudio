import { connection } from "next/server";
import { Suspense } from "react";
import { CatalogManager } from "@/components/admin/catalog-manager";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";

export const metadata = { title: "Catálogo — MG Estudio" };

export default function CatalogAdminPage() {
  return (
    <div>
      <PageHeader eyebrow="Catálogo" title="Catálogo de cortes" description="Las fotos y videos que subas acá se muestran en el apartado Catálogo de la página, con el servicio que se hizo." />
      <Suspense fallback={<div className="h-48 animate-pulse rounded-sm bg-ink/[0.04]" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  await connection(); // el panel siempre muestra los datos al día
  const [photos, staff, services] = await Promise.all([
    db.catalogPhoto.findMany({ orderBy: { createdAt: "desc" } }),
    db.staff.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.service.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }], select: { id: true, name: true } }),
  ]);
  return (
    <CatalogManager
      photos={photos.map((p) => ({ id: p.id, mediaType: p.mediaType, url: p.secureUrl, caption: p.caption, staffId: p.staffId, serviceId: p.serviceId }))}
      staff={staff}
      services={services}
    />
  );
}
