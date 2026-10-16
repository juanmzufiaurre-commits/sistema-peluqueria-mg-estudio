import { describe, expect, it } from "vitest";
import { zonedToUtc } from "@/lib/dates";
import {
  computeAvailability,
  computeDaySlots,
  rankStaffByLoad,
  type AvailabilityConfig,
  type BusyInterval,
  type StaffSchedule,
} from "./availability";

const config: AvailabilityConfig = {
  timezone: "America/Argentina/Buenos_Aires",
  bufferMinutes: 15,
  slotStepMinutes: 15,
  bookingWindowDays: 14,
  sameDayCutoffTime: "18:00",
};

const hours = [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start: "10:00", end: "20:00" }));
const staff = (n: number): StaffSchedule[] =>
  Array.from({ length: n }, (_, i) => ({ id: `s${i + 1}`, sortOrder: i + 1, hours }));

// Lunes 2030-01-07, 08:00 hora local: el local todavía no abrió.
const NOW = zonedToUtc("2030-01-07", "08:00");
const MON = "2030-01-07";
const at = (date: string, time: string) => zonedToUtc(date, time);
const iso = (d: Date) => d.toISOString();
const times = (slots: { startsAt: Date }[]) => slots.map((s) => s.startsAt.getTime());

describe("computeDaySlots", () => {
  it("genera la grilla dentro del horario y exige que entren duración + buffer", () => {
    const slots = computeDaySlots({ date: MON, now: NOW, durationMinutes: 45, config, staff: staff(1), busy: [] });
    expect(iso(slots[0].startsAt)).toBe(iso(at(MON, "10:00")));
    // 45 + 15 = 60 min: el último inicio posible es 19:00
    expect(iso(slots[slots.length - 1].startsAt)).toBe(iso(at(MON, "19:00")));
    expect(slots).toHaveLength(37);
  });

  it("un servicio largo solo entra donde alcanza el bloque completo", () => {
    const slots = computeDaySlots({ date: MON, now: NOW, durationMinutes: 180, config, staff: staff(1), busy: [] });
    // 180 + 15 = 195 min: el último inicio es 16:45
    expect(iso(slots[slots.length - 1].startsAt)).toBe(iso(at(MON, "16:45")));
  });

  it("excluye horarios que se solapan con un turno ocupado y permite el contiguo", () => {
    const busy: BusyInterval[] = [{ staffId: "s1", start: at(MON, "14:00"), end: at(MON, "15:00") }];
    const got = times(computeDaySlots({ date: MON, now: NOW, durationMinutes: 45, config, staff: staff(1), busy }));
    expect(got).not.toContain(at(MON, "13:15").getTime()); // 13:15-14:15 pisa 14:00
    expect(got).toContain(at(MON, "13:00").getTime()); // termina justo a las 14:00
    expect(got).not.toContain(at(MON, "14:30").getTime());
    expect(got).toContain(at(MON, "15:00").getTime()); // empieza justo cuando el otro termina
  });

  it("con varios profesionales, el horario sigue libre si alguno lo está", () => {
    const busy: BusyInterval[] = [{ staffId: "s1", start: at(MON, "14:00"), end: at(MON, "15:00") }];
    const slots = computeDaySlots({ date: MON, now: NOW, durationMinutes: 45, config, staff: staff(3), busy });
    const slot = slots.find((s) => s.startsAt.getTime() === at(MON, "14:00").getTime());
    expect(slot?.staffIds).toEqual(["s2", "s3"]);
  });

  it("desaparece el horario cuando todos los profesionales están ocupados", () => {
    const busy: BusyInterval[] = ["s1", "s2", "s3"].map((id) => ({ staffId: id, start: at(MON, "14:00"), end: at(MON, "15:00") }));
    const got = times(computeDaySlots({ date: MON, now: NOW, durationMinutes: 45, config, staff: staff(3), busy }));
    expect(got).not.toContain(at(MON, "14:00").getTime());
  });

  it("un bloqueo del local (staffId null) cierra a todos", () => {
    const busy: BusyInterval[] = [{ staffId: null, start: at(MON, "10:00"), end: at(MON, "20:00") }];
    expect(computeDaySlots({ date: MON, now: NOW, durationMinutes: 45, config, staff: staff(3), busy })).toEqual([]);
  });

  it("domingo no hay horarios (día no laborable)", () => {
    expect(computeDaySlots({ date: "2030-01-13", now: NOW, durationMinutes: 45, config, staff: staff(3), busy: [] })).toEqual([]);
  });

  it("hoy: no lista horarios ya pasados", () => {
    const now = zonedToUtc(MON, "12:10");
    const slots = computeDaySlots({ date: MON, now, durationMinutes: 45, config, staff: staff(1), busy: [] });
    expect(slots[0].startsAt.getTime()).toBe(at(MON, "12:15").getTime());
  });

  it("hoy: pasada la hora de corte no hay horarios", () => {
    const now = zonedToUtc(MON, "18:01");
    expect(computeDaySlots({ date: MON, now, durationMinutes: 45, config, staff: staff(1), busy: [] })).toEqual([]);
  });

  it("no hay horarios fuera de la ventana de 14 días ni en el pasado", () => {
    const q = { now: NOW, durationMinutes: 45, config, staff: staff(1), busy: [] };
    expect(computeDaySlots({ ...q, date: "2030-01-19" }).length).toBeGreaterThan(0); // último día de la ventana (hoy + 13), sábado
    expect(computeDaySlots({ ...q, date: "2030-01-21" })).toEqual([]);
    expect(computeDaySlots({ ...q, date: "2030-01-06" })).toEqual([]);
  });

  it("modo admin: permite pasada la hora de corte y fuera de la ventana, pero no el pasado", () => {
    const late = zonedToUtc(MON, "18:01");
    const q = { durationMinutes: 45, config, staff: staff(1), busy: [], adminMode: true };
    expect(computeDaySlots({ ...q, now: late, date: MON }).length).toBeGreaterThan(0);
    expect(times(computeDaySlots({ ...q, now: late, date: MON }))[0]).toBeGreaterThan(late.getTime());
    expect(computeDaySlots({ ...q, now: NOW, date: "2030-01-28" }).length).toBeGreaterThan(0);
    expect(computeDaySlots({ ...q, now: NOW, date: "2030-01-06" })).toEqual([]);
  });

  it("respeta el horario propio de cada profesional", () => {
    const team: StaffSchedule[] = [
      { id: "manana", sortOrder: 1, hours: [{ weekday: 1, start: "10:00", end: "14:00" }] },
      { id: "tarde", sortOrder: 2, hours: [{ weekday: 1, start: "14:00", end: "20:00" }] },
    ];
    const slots = computeDaySlots({ date: MON, now: NOW, durationMinutes: 45, config, staff: team, busy: [] });
    expect(slots.find((s) => s.startsAt.getTime() === at(MON, "11:00").getTime())?.staffIds).toEqual(["manana"]);
    expect(slots.find((s) => s.startsAt.getTime() === at(MON, "16:00").getTime())?.staffIds).toEqual(["tarde"]);
  });

  it("soporta pausa del mediodía con dos tramos", () => {
    const split: StaffSchedule[] = [
      { id: "s1", sortOrder: 1, hours: [{ weekday: 1, start: "10:00", end: "13:00" }, { weekday: 1, start: "15:00", end: "20:00" }] },
    ];
    const got = times(computeDaySlots({ date: MON, now: NOW, durationMinutes: 45, config, staff: split, busy: [] }));
    expect(got).not.toContain(at(MON, "13:30").getTime());
    expect(got).toContain(at(MON, "15:00").getTime());
  });
});

describe("computeAvailability", () => {
  it("devuelve 14 días consecutivos desde hoy", () => {
    const days = computeAvailability({ now: NOW, durationMinutes: 45, config, staff: staff(1), busy: [] });
    expect(days).toHaveLength(14);
    expect(days[0].date).toBe(MON);
    expect(days[13].date).toBe("2030-01-20");
    expect(days.find((d) => d.date === "2030-01-13")?.slots).toEqual([]); // domingo
  });
});

describe("rankStaffByLoad", () => {
  it("prioriza al profesional con menos turnos ese día", () => {
    const load = new Map([["s1", 4], ["s2", 1], ["s3", 2]]);
    expect(rankStaffByLoad(["s1", "s2", "s3"], load)).toEqual(["s2", "s3", "s1"]);
  });
  it("desempata por orden", () => {
    expect(rankStaffByLoad(["s1", "s2", "s3"], new Map())).toEqual(["s1", "s2", "s3"]);
  });
});
