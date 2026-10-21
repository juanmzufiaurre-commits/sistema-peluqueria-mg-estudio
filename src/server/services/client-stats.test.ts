import { describe, expect, it } from "vitest";
import { clientStats, daysSinceLastVisit, isInactive, matchesQuery, sortClients, type ClientBooking } from "./client-stats";

const NOW = new Date("2030-06-30T15:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const b = (startsAt: Date, over: Partial<ClientBooking> = {}): ClientBooking => ({
  startsAt,
  status: "COMPLETED",
  priceArs: 16000,
  serviceName: "Corte",
  staffName: "Juan",
  ...over,
});

describe("clientStats", () => {
  const s = clientStats(
    [
      b(daysAgo(90)),
      b(daysAgo(40), { serviceName: "Corte y Mechas", priceArs: 50000, staffName: "Gonza" }),
      b(daysAgo(10)),
      b(daysAgo(5), { status: "NO_SHOW" }),
      b(daysAgo(3), { status: "CANCELLED_BY_CLIENT" }),
      b(daysAgo(-7), { status: "CONFIRMED" }), // dentro de una semana
      b(daysAgo(-2), { status: "PENDING" }),
    ],
    NOW,
  );

  it("cuenta como visitas solo los turnos completados y suma lo que gastó en ellos", () => {
    expect(s.visits).toBe(3);
    expect(s.spentArs).toBe(16000 + 50000 + 16000);
    expect(s.noShows).toBe(1);
    expect(s.cancellations).toBe(1);
  });

  it("toma la primera y la última visita, y el próximo turno activo más cercano", () => {
    expect(s.firstBookingAt).toEqual(daysAgo(90));
    expect(s.firstVisitAt).toEqual(daysAgo(90));
    expect(s.lastVisitAt).toEqual(daysAgo(10));
    expect(s.nextBookingAt).toEqual(daysAgo(-2));
  });

  it("elige el servicio y el profesional más frecuentes", () => {
    expect(s.favoriteService).toBe("Corte");
    expect(s.favoriteStaff).toBe("Juan");
  });

  it("un cliente sin turnos queda en cero", () => {
    const empty = clientStats([], NOW);
    expect(empty).toMatchObject({ visits: 0, spentArs: 0, lastVisitAt: null, nextBookingAt: null, favoriteService: null });
    expect(daysSinceLastVisit(empty, NOW)).toBeNull();
  });
});

describe("isInactive", () => {
  it("es para recuperar si vino, no volvió en más de 60 días y no tiene turno", () => {
    expect(isInactive(clientStats([b(daysAgo(61))], NOW), NOW)).toBe(true);
    expect(isInactive(clientStats([b(daysAgo(30))], NOW), NOW)).toBe(false);
    expect(isInactive(clientStats([b(daysAgo(61)), b(daysAgo(-3), { status: "CONFIRMED" })], NOW), NOW)).toBe(false);
    expect(isInactive(clientStats([b(daysAgo(-3), { status: "CONFIRMED" })], NOW), NOW)).toBe(false); // nunca vino
  });
});

describe("matchesQuery", () => {
  const c = { firstName: "Tomás", lastName: "Herrera", phoneE164: "+5491122334455" };

  it("busca por nombre sin importar tildes, mayúsculas ni el orden de las palabras", () => {
    expect(matchesQuery(c, "tomas")).toBe(true);
    expect(matchesQuery(c, "HERRERA tom")).toBe(true);
    expect(matchesQuery(c, "lucia")).toBe(false);
    expect(matchesQuery(c, "  ")).toBe(true);
  });

  it("busca por parte del teléfono, con o sin espacios y guiones", () => {
    expect(matchesQuery(c, "2233")).toBe(true);
    expect(matchesQuery(c, "11 2233-4455")).toBe(true);
    expect(matchesQuery(c, "9999")).toBe(false);
  });
});

describe("sortClients", () => {
  const row = (firstName: string, bookings: ClientBooking[], createdDaysAgo = 200) => ({
    firstName,
    lastName: null,
    createdAt: daysAgo(createdDaysAgo),
    stats: clientStats(bookings, NOW),
  });
  const rows = [
    row("Bruno", [b(daysAgo(100)), b(daysAgo(80))]),
    row("Ana", [b(daysAgo(5)), b(daysAgo(20)), b(daysAgo(30))]),
    row("Carla", [b(daysAgo(150))]),
    row("Dani", [], 1), // recién registrado, sin visitas
  ];
  const names = (list: { firstName: string }[]) => list.map((r) => r.firstName);

  it("recientes: el que tuvo actividad más cerca de hoy primero", () => {
    expect(names(sortClients(rows, "recientes", NOW))).toEqual(["Dani", "Ana", "Bruno", "Carla"]);
  });

  it("visitas: el que más vino primero", () => {
    expect(names(sortClients(rows, "visitas", NOW))).toEqual(["Ana", "Bruno", "Carla", "Dani"]);
  });

  it("nombre: alfabético", () => {
    expect(names(sortClients(rows, "nombre", NOW))).toEqual(["Ana", "Bruno", "Carla", "Dani"]);
  });

  it("recuperar: solo los inactivos, el que hace más que no viene primero", () => {
    expect(names(sortClients(rows, "recuperar", NOW))).toEqual(["Carla", "Bruno"]);
  });
});
