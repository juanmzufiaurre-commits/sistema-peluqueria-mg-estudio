import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl } from "./ics";

const event = {
  uid: "MG-ABC123",
  title: "Corte — MG Estudio",
  description: "Turno MG-ABC123; llegar 5 min antes",
  location: "Av. Siempre Viva 742, CABA",
  start: new Date("2030-01-07T17:00:00Z"),
  end: new Date("2030-01-07T17:45:00Z"),
};

describe("ics", () => {
  it("genera un VEVENT válido con fechas en UTC y texto escapado", () => {
    const ics = buildIcs(event);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20300107T170000Z");
    expect(ics).toContain("DTEND:20300107T174500Z");
    expect(ics).toContain("UID:MG-ABC123@mgestudio");
    expect(ics).toContain("DESCRIPTION:Turno MG-ABC123\\; llegar 5 min antes");
    expect(ics).toContain("LOCATION:Av. Siempre Viva 742\\, CABA");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("omite campos opcionales vacíos", () => {
    const ics = buildIcs({ ...event, description: undefined, location: undefined });
    expect(ics).not.toContain("DESCRIPTION");
    expect(ics).not.toContain("LOCATION");
  });

  it("arma el enlace de Google Calendar", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("dates")).toBe("20300107T170000Z/20300107T174500Z");
    expect(url.searchParams.get("text")).toBe("Corte — MG Estudio");
  });
});
