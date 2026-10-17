import { connection } from "next/server";
import { Suspense } from "react";
import { StaffManager } from "@/components/admin/staff-manager";
import { db } from "@/lib/db";

export const metadata = { title: "Equipo — MG Estudio" };

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-semibold">Equipo</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-sm bg-cream-deep" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  await connection(); // el panel siempre muestra los datos al día
  const staff = await db.staff.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return (
    <StaffManager
      staff={staff.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        instagram: s.instagram,
        photoUrl: s.photoUrl,
        certificate: s.certificate,
      }))}
    />
  );
}
