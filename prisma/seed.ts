import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Falta DIRECT_URL o DATABASE_URL");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const SERVICES = [
  {
    name: "Corte",
    description: "Corte clásico o a tu medida, con el cuidado de siempre.",
    includes: ["Corte", "Barba", "Lavado", "Café", "Acceso a PS5"],
    priceArs: 16000,
    durationMinutes: 45,
    sortOrder: 1,
  },
  {
    name: "Corte y Mechas",
    description: "Mechas a tu gusto más corte y terminación completa.",
    includes: ["Mechas", "Corte", "Barba", "Lavado", "Café", "Acceso a PS5"],
    priceArs: 50000,
    durationMinutes: 150,
    sortOrder: 2,
  },
  {
    name: "Corte y Global",
    description: "Decoloración global más corte y terminación completa.",
    includes: ["Decoloración global", "Corte", "Barba", "Lavado", "Café", "Acceso a PS5"],
    priceArs: 60000,
    durationMinutes: 180,
    sortOrder: 3,
  },
];

// Provisorio: 3 profesionales fijos. Se renombran/ajustan desde el panel cuando se defina el equipo real.
const STAFF_COUNT = 3;

async function main() {
  for (const s of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (existing) await prisma.service.update({ where: { id: existing.id }, data: s });
    else await prisma.service.create({ data: s });
  }

  const staff = await prisma.staff.findMany({ orderBy: { sortOrder: "asc" } });
  for (let i = staff.length; i < STAFF_COUNT; i++) {
    await prisma.staff.create({ data: { name: `Profesional ${i + 1}`, sortOrder: i + 1 } });
  }

  await prisma.systemConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  // Horario general del local (staffId null): lunes a sábado 10:00-20:00.
  // Un profesional sin horario propio hereda este.
  if ((await prisma.workingHour.count({ where: { staffId: null } })) === 0) {
    await prisma.workingHour.createMany({
      data: [1, 2, 3, 4, 5, 6].map((weekday) => ({ staffId: null, weekday, startTime: "10:00", endTime: "20:00" })),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
