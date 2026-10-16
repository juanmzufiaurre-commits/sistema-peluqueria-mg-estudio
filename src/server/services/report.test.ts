import { describe, expect, it } from "vitest";
import { zonedToUtc } from "@/lib/dates";
import { buildReport, occupancyRatio, type ReportBooking } from "./report";

const TZ = "America/Argentina/Buenos_Aires";
const b = (date: string, time: string, over: Partial<ReportBooking> = {}): ReportBooking => ({
  startsAt: zonedToUtc(date, time),
  serviceName: "Corte",
  priceArs: 16000,
  durationMinutes: 45,
  status: "CONFIRMED",
  ...over,
});

describe("buildReport", () => {
  const bookings: ReportBooking[] = [
    b("2030-01-07", "10:00"), // lunes
    b("2030-01-07", "11:00", { status: "COMPLETED" }),
    b("2030-01-08", "10:30", { serviceName: "Corte y Global", priceArs: 60000, status: "COMPLETED" }),
    b("2030-01-08", "16:00", { status: "NO_SHOW" }),
    b("2030-01-09", "10:00", { status: "CANCELLED_BY_CLIENT" }),
  ];
  const r = buildReport(bookings, TZ);

  it("no cuenta los cancelados como turnos ni como facturación", () => {
    expect(r.totalBookings).toBe(4);
    expect(r.cancelled).toBe(1);
    expect(r.revenueArs).toBe(16000 + 16000 + 60000); // el NO_SHOW no factura
  });

  it("calcula la tasa de ausentismo sobre turnos finalizados", () => {
    expect(r.noShowRate).toBeCloseTo(1 / 3); // 1 no-show, 2 completados
  });

  it("tasa de ausentismo es null sin turnos finalizados", () => {
    expect(buildReport([b("2030-01-07", "10:00")], TZ).noShowRate).toBeNull();
  });

  it("ordena servicios por cantidad", () => {
    expect(r.topServices.map((s) => s.name)).toEqual(["Corte", "Corte y Global"]);
    expect(r.topServices[0]).toMatchObject({ count: 2, revenueArs: 32000 });
  });

  it("agrupa por día de la semana y hora local", () => {
    expect(r.byWeekday[1]).toBe(2); // lunes
    expect(r.byWeekday[2]).toBe(2); // martes
    expect(r.byHour[10]).toBe(2);
    expect(r.byHour[16]).toBe(1);
  });

  it("agrupa facturación por día local", () => {
    expect(r.revenueByDay).toEqual([
      { date: "2030-01-07", revenueArs: 32000 },
      { date: "2030-01-08", revenueArs: 60000 },
    ]);
  });
});

describe("occupancyRatio", () => {
  it("acota entre 0 y 1 y tolera disponibilidad cero", () => {
    expect(occupancyRatio(300, 600)).toBe(0.5);
    expect(occupancyRatio(900, 600)).toBe(1);
    expect(occupancyRatio(100, 0)).toBe(0);
  });
});
