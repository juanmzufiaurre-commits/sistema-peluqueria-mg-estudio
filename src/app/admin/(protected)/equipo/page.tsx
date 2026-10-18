import { connection } from "next/server";
import { Suspense } from "react";
import { StaffManager } from "@/components/admin/staff-manager";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";

export const metadata = { title: "Equipo — MG Estudio" };

export default function TeamPage() {
  return (
    <div>
      <PageHeader eyebrow="Equipo" title="Tu equipo" description="Foto, especialidad, Instagram y certificado de cada profesional. Es lo que se ve en el apartado Profesionales de la página." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-sm bg-ink/[0.04]" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  await connection(); // el panel siempre muestra los datos al día
  const staff = await db.staff.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { certificates: { orderBy: { sortOrder: "asc" } } },
  });
  return (
    <StaffManager
      staff={staff.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        instagram: s.instagram,
        photoUrl: s.photoUrl,
        certificates: s.certificates.map((c) => ({ name: c.name, academy: c.academy })),
      }))}
    />
  );
}
