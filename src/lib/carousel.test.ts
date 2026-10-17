import { describe, expect, it } from "vitest";
import { centeredIndex, distanceFromCenter, scrollLeftFor } from "./carousel";

describe("centeredIndex", () => {
  // contenedor de 500px: cada elemento ocupa 100px
  it("el primero está centrado sin desplazamiento", () => expect(centeredIndex(0, 500, 12)).toBe(0));
  it("redondea al elemento más cercano", () => {
    expect(centeredIndex(40, 500, 12)).toBe(0);
    expect(centeredIndex(60, 500, 12)).toBe(1);
    expect(centeredIndex(250, 500, 12)).toBe(3); // 2,5 redondea hacia arriba
  });
  it("no se pasa de los extremos", () => {
    expect(centeredIndex(-30, 500, 12)).toBe(0);
    expect(centeredIndex(99999, 500, 12)).toBe(11);
  });
  it("tolera lista vacía o contenedor sin medir", () => {
    expect(centeredIndex(100, 500, 0)).toBe(0);
    expect(centeredIndex(100, 0, 5)).toBe(0);
  });
});

describe("scrollLeftFor", () => {
  it("es la inversa de centeredIndex", () => {
    for (const i of [0, 1, 5, 11]) expect(centeredIndex(scrollLeftFor(i, 500), 500, 12)).toBe(i);
  });
});

describe("distanceFromCenter", () => {
  it("mide en ambos sentidos", () => {
    expect(distanceFromCenter(3, 3)).toBe(0);
    expect(distanceFromCenter(1, 3)).toBe(2);
    expect(distanceFromCenter(5, 3)).toBe(2);
  });
});
