import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export interface PublicService {
  id: string;
  name: string;
  description: string;
  includes: string[];
  priceArs: number;
  durationMinutes: number;
}

export interface PublicInfo {
  businessName: string;
  address: string | null;
  whatsappNumber: string | null;
}

/** Servicios activos. Se invalidan con updateTag("services") al editar el catálogo desde el panel. */
export async function getActiveServices(): Promise<PublicService[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("services");

  const services = await db.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    includes: s.includes,
    priceArs: s.priceArs,
    durationMinutes: s.durationMinutes,
  }));
}

/** Datos públicos del local. Se invalidan con updateTag("config"). */
export async function getPublicInfo(): Promise<PublicInfo> {
  "use cache";
  cacheLife("hours");
  cacheTag("config");

  const c = await db.systemConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return { businessName: c.businessName, address: c.address, whatsappNumber: c.whatsappNumber };
}
