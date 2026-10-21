import { describe, expect, it } from "vitest";
import { waComeBack, waGreeting, waLink, waMessage, type WaContext } from "./wa-links";

const ctx: WaContext = {
  firstName: "Juan",
  dateLabel: "Sábado, 17 de octubre",
  timeLabel: "14:00",
  serviceName: "Corte",
  businessName: "MG Estudio",
  address: "Av. Siempre Viva 742",
  rebookUrl: "https://mg.example/",
};

describe("wa-links", () => {
  it("el mensaje de cancelación sigue el texto del spec", () => {
    const m = waMessage("cancellation", ctx);
    expect(m).toContain("Hola Juan, tu turno para el día Sábado, 17 de octubre a las 14:00 hs debió ser cancelado por el local.");
    expect(m).toContain("https://mg.example/");
  });

  it("todos los mensajes incluyen nombre y hora", () => {
    for (const t of ["confirmation", "reminder", "reschedule", "cancellation"] as const) {
      const m = waMessage(t, ctx);
      expect(m).toContain("Juan");
      expect(m).toContain("14:00");
    }
  });

  it("el mensaje para invitar a volver lleva el nombre, el local y el enlace para reservar", () => {
    const m = waComeBack("Juan", "MG Estudio", "https://mg.example/");
    expect(m).toContain("Hola Juan");
    expect(m).toContain("MG Estudio");
    expect(m).toContain("https://mg.example/");
    expect(waGreeting("Juan", "MG Estudio")).toBe("Hola Juan, te escribimos de MG Estudio.");
  });

  it("arma el enlace wa.me con el texto codificado y sin el +", () => {
    const url = waLink("+5491123456789", "Hola & chau");
    expect(url).toBe("https://wa.me/5491123456789?text=Hola%20%26%20chau");
  });
});
