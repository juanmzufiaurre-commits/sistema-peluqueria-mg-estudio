import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("permite hasta el límite y bloquea el exceso dentro de la ventana", () => {
    const t = 1_000_000;
    expect([1, 2, 3].map((i) => rateLimit("a", 3, 60_000, t + i))).toEqual([true, true, true]);
    expect(rateLimit("a", 3, 60_000, t + 10)).toBe(false);
  });

  it("vuelve a permitir cuando pasó la ventana", () => {
    const t = 2_000_000;
    rateLimit("b", 1, 1000, t);
    expect(rateLimit("b", 1, 1000, t + 500)).toBe(false);
    expect(rateLimit("b", 1, 1000, t + 1500)).toBe(true);
  });

  it("cuenta cada clave por separado", () => {
    const t = 3_000_000;
    rateLimit("c", 1, 1000, t);
    expect(rateLimit("d", 1, 1000, t)).toBe(true);
  });
});
