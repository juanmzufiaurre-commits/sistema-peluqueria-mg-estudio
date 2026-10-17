import { connection } from "next/server";
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
