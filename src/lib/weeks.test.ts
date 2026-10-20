import { describe, expect, it } from "vitest";
import { addWeeks, isWeekStart, weekDays, weekRange, weekStart } from "./weeks";

describe("semanas", () => {
  it("la semana arranca el lunes (también desde un domingo)", () => {
    expect(weekStart("2026-10-21")).toBe("2026-10-19"); // miércoles → lunes
    expect(weekStart("2026-10-19")).toBe("2026-10-19"); // lunes
    expect(weekStart("2026-10-25")).toBe("2026-10-19"); // domingo → lunes anterior
  });

  it("reconoce un lunes válido", () => {
    expect(isWeekStart("2026-10-19")).toBe(true);
    expect(isWeekStart("2026-10-20")).toBe(false);
    expect(isWeekStart("cualquier cosa")).toBe(false);
  });

  it("suma semanas cruzando meses y arma la lista de días", () => {
    expect(addWeeks("2026-10-26", 1)).toBe("2026-11-02");
    expect(weekDays("2026-10-26")).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
    expect(weekRange("2026-10-12", "2026-10-26")).toEqual(["2026-10-12", "2026-10-19", "2026-10-26"]);
  });
});
