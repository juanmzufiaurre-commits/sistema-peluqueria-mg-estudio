import { connection } from "next/server";
import { Suspense } from "react";
import { ServiceManager } from "@/components/admin/service-manager";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";

export const metadata = { title: "Servicios — MG Estudio" };

export default function ServicesPage() {
  return (
    <div>
      <PageHeader eyebrow="Servicios" title="Lo que ofrecés" description="Precios, duración y qué incluye cada servicio. Es lo que ven los clientes al reservar." />
      <Suspense fallback={<div className="h-48 animate-pulse rounded-sm bg-ink/[0.04]" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  await connection(); // se usa la hora actual para contar los turnos próximos
  const [services, totals, upcoming] = await Promise.all([
    db.service.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
    db.booking.groupBy({ by: ["serviceId"], where: { serviceId: { not: null } }, _count: { _all: true } }),
    db.booking.groupBy({
      by: ["serviceId"],
      where: { serviceId: { not: null }, startDatetime: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
      _count: { _all: true },
    }),
  ]);
  const totalBy = new Map(totals.map((t) => [t.serviceId, t._count._all]));
  const upcomingBy = new Map(upcoming.map((t) => [t.serviceId, t._count._all]));
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
        bookingCount: totalBy.get(s.id) ?? 0,
        upcomingCount: upcomingBy.get(s.id) ?? 0,
      }))}
    />
  );
}
