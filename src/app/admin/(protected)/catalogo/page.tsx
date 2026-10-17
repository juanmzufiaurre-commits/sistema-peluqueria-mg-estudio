import { connection } from "next/server";
import { Suspense } from "react";
import { CatalogManager } from "@/components/admin/catalog-manager";
import { db } from "@/lib/db";

export const metadata = { title: "Catálogo — MG Estudio" };

export default function CatalogAdminPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 font-display text-3xl font-semibold">Catálogo de cortes</h1>
      <p className="mb-6 text-sm text-ink-soft">Las fotos que subas acá se muestran en el apartado Catálogo de la página.</p>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-sm bg-cream-deep" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  await connection(); // el panel siempre muestra los datos al día
  const [photos, staff] = await Promise.all([
    db.catalogPhoto.findMany({ orderBy: { createdAt: "desc" } }),
    db.staff.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  return <CatalogManager photos={photos.map((p) => ({ id: p.id, url: p.secureUrl, caption: p.caption, staffId: p.staffId }))} staff={staff} />;
}
