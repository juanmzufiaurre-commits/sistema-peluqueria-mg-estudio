import { describe, expect, it } from "vitest";
import { formatAgo, formatPhone, formatShortDate } from "./format";

describe("format", () => {
  it("fecha corta, en la zona del estudio", () => {
    expect(formatShortDate("2026-10-20T15:00:00Z")).toBe("20 oct 2026");
    expect(formatShortDate("2026-10-21T01:00:00Z")).toBe("20 oct 2026"); // todavía es 20 en Buenos Aires
  });

  it("cuánto pasó, en palabras", () => {
    expect(formatAgo(0)).toBe("hoy");
    expect(formatAgo(1)).toBe("ayer");
    expect(formatAgo(12)).toBe("hace 12 días");
    expect(formatAgo(45)).toBe("hace 1 mes");
    expect(formatAgo(100)).toBe("hace 3 meses");
    expect(formatAgo(400)).toBe("hace 1 año");
  });

  it("teléfono legible", () => {
    expect(formatPhone("+5491122334455")).toBe("11 2233-4455");
    expect(formatPhone("+5493511234567")).toBe("351 123-4567");
    expect(formatPhone("+1555")).toBe("+1555");
  });
});
