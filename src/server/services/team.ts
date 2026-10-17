import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export interface PublicStaff {
  id: string;
  name: string;
  role: string | null;
  instagram: string | null;
  photoUrl: string | null;
  certificate: string | null;
}

export interface PublicCatalogPhoto {
  id: string;
  url: string;
  caption: string | null;
  staffId: string | null;
  staffName: string | null;
}

/** Profesionales activos para el apartado público. Se invalidan con updateTag("team"). */
export async function getPublicTeam(): Promise<PublicStaff[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("team");

  const staff = await db.staff.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return staff.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    instagram: s.instagram,
    photoUrl: s.photoUrl,
    certificate: s.certificate,
  }));
}

/** Catálogo de cortes, lo más nuevo primero. Se invalida con updateTag("catalog"). */
export async function getCatalogPhotos(): Promise<PublicCatalogPhoto[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const photos = await db.catalogPhoto.findMany({
    orderBy: { createdAt: "desc" },
    include: { staff: { select: { name: true, isActive: true } } },
  });
  return photos.map((p) => ({
    id: p.id,
    url: p.secureUrl,
    caption: p.caption,
    staffId: p.staff?.isActive ? p.staffId : null,
    staffName: p.staff?.isActive ? p.staff.name : null,
  }));
}
