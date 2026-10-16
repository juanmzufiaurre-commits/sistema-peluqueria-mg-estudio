import { Suspense } from "react";
import { ServiceManager } from "@/components/admin/service-manager";
import { db } from "@/lib/db";

export const metadata = { title: "Servicios — MG Estudio" };

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-semibold">Servicios</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-sm bg-cream-deep" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  const services = await db.service.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] });
  return (
    <ServiceManager
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        includes: s.includes,
        priceArs: s.priceArs,
        durationMinutes: s.durationMinutes,
        isActive: s.isActive,
      }))}
    />
  );
}
