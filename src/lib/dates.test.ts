import { describe, expect, it } from "vitest";
import { addDaysToDateString, dayBoundsUtc, localDateString, localTimeString, weekdayOfDateString, zonedToUtc } from "./dates";

describe("dates (America/Argentina/Buenos_Aires, UTC-3)", () => {
  it("convierte hora de pared a UTC", () => {
    expect(zonedToUtc("2030-01-07", "14:00").toISOString()).toBe("2030-01-07T17:00:00.000Z");
  });

  it("la fecha local cruza medianoche UTC correctamente", () => {
    const d = new Date("2030-01-08T01:30:00Z"); // 22:30 del día 7 en Buenos Aires
    expect(localDateString(d)).toBe("2030-01-07");
    expect(localTimeString(d)).toBe("22:30");
  });

  it("suma días y calcula día de la semana", () => {
    expect(addDaysToDateString("2030-01-31", 1)).toBe("2030-02-01");
    expect(weekdayOfDateString("2030-01-07")).toBe(1); // lunes
  });

  it("límites del día local", () => {
    const { start, end } = dayBoundsUtc("2030-01-07");
    expect(start.toISOString()).toBe("2030-01-07T03:00:00.000Z");
    expect(end.toISOString()).toBe("2030-01-08T03:00:00.000Z");
  });
});
