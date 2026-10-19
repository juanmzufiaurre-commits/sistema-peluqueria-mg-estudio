import { describe, expect, it } from "vitest";
import { addMonths, isMonthString, monthBounds, monthRange } from "./months";

describe("meses", () => {
  it("valida el formato yyyy-MM", () => {
    expect(isMonthString("2026-10")).toBe(true);
    expect(isMonthString("2026-13")).toBe(false);
    expect(isMonthString("2026-1")).toBe(false);
  });

  it("suma y resta meses cruzando el año", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2025-12", 1)).toBe("2026-01");
    expect(addMonths("2026-10", 14)).toBe("2027-12");
  });

  it("calcula primer y último día, incluido febrero bisiesto", () => {
    expect(monthBounds("2026-10")).toEqual({ first: "2026-10-01", last: "2026-10-31" });
    expect(monthBounds("2028-02")).toEqual({ first: "2028-02-01", last: "2028-02-29" });
  });

  it("arma el rango de meses inclusive", () => {
    expect(monthRange("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});
