import { describe, expect, it } from "vitest";
import { blockSchema, settingsSchema, workingHoursSchema } from "./config";

describe("workingHoursSchema", () => {
  const ok = (ranges: { weekday: number; start: string; end: string }[]) => workingHoursSchema.safeParse({ ranges }).success;

  it("acepta tramos válidos, incluida pausa del mediodía", () => {
    expect(ok([{ weekday: 1, start: "10:00", end: "13:00" }, { weekday: 1, start: "15:00", end: "20:00" }])).toBe(true);
  });
  it("rechaza cierre antes de apertura", () => expect(ok([{ weekday: 1, start: "20:00", end: "10:00" }])).toBe(false));
  it("rechaza tramos superpuestos del mismo día", () => {
    expect(ok([{ weekday: 2, start: "10:00", end: "14:00" }, { weekday: 2, start: "13:00", end: "18:00" }])).toBe(false);
  });
  it("permite mismo horario en días distintos", () => {
    expect(ok([{ weekday: 1, start: "10:00", end: "14:00" }, { weekday: 2, start: "13:00", end: "18:00" }])).toBe(true);
  });
});

describe("settingsSchema", () => {
  const base = { businessName: "MG Estudio", address: "", whatsappNumber: "", bufferMinutes: "15", slotStepMinutes: "15", bookingWindowDays: "14", sameDayCutoffTime: "18:00", minCancelHours: "2" };
  it("convierte texto a números y vacíos a null", () => {
    const r = settingsSchema.parse(base);
    expect(r).toMatchObject({ bufferMinutes: 15, address: null, whatsappNumber: null, minCancelHours: 2 });
  });
  it("normaliza el WhatsApp del local", () => {
    expect(settingsSchema.parse({ ...base, whatsappNumber: "11 2345-6789" }).whatsappNumber).toBe("+5491123456789");
  });
  it("rechaza intervalos no permitidos", () => {
    expect(settingsSchema.safeParse({ ...base, slotStepMinutes: "7" }).success).toBe(false);
  });
});

describe("blockSchema", () => {
  it("día completo sin horas", () => {
    expect(blockSchema.safeParse({ startDate: "2030-01-07", endDate: "2030-01-07", startTime: "", endTime: "", reason: "Feriado" }).success).toBe(true);
  });
  it("rechaza horas incompletas", () => {
    expect(blockSchema.safeParse({ startDate: "2030-01-07", endDate: "2030-01-07", startTime: "10:00", endTime: "" }).success).toBe(false);
  });
  it("rechaza fin antes de inicio", () => {
    expect(blockSchema.safeParse({ startDate: "2030-01-08", endDate: "2030-01-07" }).success).toBe(false);
  });
});
