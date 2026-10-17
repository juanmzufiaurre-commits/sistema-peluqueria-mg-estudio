import { describe, expect, it } from "vitest";
import { googleCalendarUrl } from "./google-calendar";

const event = {
  title: "Corte — MG Estudio",
  description: "Turno MG-ABC123",
  location: "Av. Siempre Viva 742, CABA",
  start: new Date("2030-01-07T17:00:00Z"),
  end: new Date("2030-01-07T17:45:00Z"),
};

describe("googleCalendarUrl", () => {
  it("arma el enlace con fechas en UTC", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20300107T170000Z/20300107T174500Z");
    expect(url.searchParams.get("text")).toBe("Corte — MG Estudio");
    expect(url.searchParams.get("details")).toBe("Turno MG-ABC123");
    expect(url.searchParams.get("location")).toBe("Av. Siempre Viva 742, CABA");
  });

  it("omite descripción y lugar si no se informan", () => {
    const url = new URL(googleCalendarUrl({ ...event, description: undefined, location: undefined }));
    expect(url.searchParams.has("details")).toBe(false);
    expect(url.searchParams.has("location")).toBe(false);
  });
});
