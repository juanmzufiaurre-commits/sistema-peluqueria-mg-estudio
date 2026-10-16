import {
  addDaysToDateString,
  addMinutes,
  localDateString,
  localTimeString,
  timeToMinutes,
  weekdayOfDateString,
  zonedToUtc,
} from "@/lib/dates";

export interface AvailabilityConfig {
  timezone: string;
  bufferMinutes: number;
  slotStepMinutes: number;
  bookingWindowDays: number;
  sameDayCutoffTime: string; // "HH:mm"
}

export interface WorkingRange {
  weekday: number; // 0 = domingo ... 6 = sábado
  start: string; // "HH:mm"
  end: string;
}

export interface StaffSchedule {
  id: string;
  sortOrder: number;
  /** Tramos ya resueltos: los propios del profesional o, si no tiene, los del local. */
  hours: WorkingRange[];
}

/** Intervalo ocupado [start, end). staffId null = afecta a todo el local (feriado, cierre). */
export interface BusyInterval {
  staffId: string | null;
  start: Date;
  end: Date;
}

export interface Slot {
  startsAt: Date;
  /** Profesionales libres para este horario, ordenados por sortOrder. */
  staffIds: string[];
}

export interface DaySlots {
  date: string; // yyyy-MM-dd local
  slots: Slot[];
}

export interface DayQuery {
  date: string;
  now: Date;
  /** Duración del servicio, sin buffer. */
  durationMinutes: number;
  config: AvailabilityConfig;
  staff: StaffSchedule[];
  busy: BusyInterval[];
  /** El admin puede agendar fuera de la ventana de 14 días y pasada la hora de corte (nunca en el pasado). */
  adminMode?: boolean;
}

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean => aStart < bEnd && bStart < aEnd;

/**
 * Bloque que ocupa un turno: [start, start + duración + buffer).
 * Rango semiabierto: un turno que empieza justo donde otro termina no se solapa.
 */
export const occupiedEnd = (start: Date, durationMinutes: number, bufferMinutes: number): Date =>
  addMinutes(start, durationMinutes + bufferMinutes);

/** Último día reservable: hoy + bookingWindowDays - 1 (ej. 14 días corridos incluyendo hoy). */
export const lastBookableDate = (now: Date, config: AvailabilityConfig): string =>
  addDaysToDateString(localDateString(now, config.timezone), config.bookingWindowDays - 1);

export function computeDaySlots(q: DayQuery): Slot[] {
  const { date, now, durationMinutes, config, staff, busy, adminMode = false } = q;
  const today = localDateString(now, config.timezone);

  if (date < today) return [];
  if (!adminMode) {
    if (date > lastBookableDate(now, config)) return [];
    // Día corriente: pasada la hora de corte no se listan bloques.
    if (date === today && localTimeString(now, config.timezone) > config.sameDayCutoffTime) return [];
  }

  const weekday = weekdayOfDateString(date);
  const blockMinutes = durationMinutes + config.bufferMinutes;
  const byStart = new Map<number, Slot>();

  for (const member of [...staff].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const memberBusy = busy.filter((b) => b.staffId === null || b.staffId === member.id);

    for (const range of member.hours) {
      if (range.weekday !== weekday) continue;
      const startMin = timeToMinutes(range.start);
      const endMin = timeToMinutes(range.end);

      for (let t = startMin; t + blockMinutes <= endMin; t += config.slotStepMinutes) {
        const hh = String(Math.floor(t / 60)).padStart(2, "0");
        const mm = String(t % 60).padStart(2, "0");
        const startsAt = zonedToUtc(date, `${hh}:${mm}`, config.timezone);
        if (startsAt <= now) continue;

        const endsAt = occupiedEnd(startsAt, durationMinutes, config.bufferMinutes);
        if (memberBusy.some((b) => overlaps(startsAt, endsAt, b.start, b.end))) continue;

        const key = startsAt.getTime();
        const slot = byStart.get(key);
        if (slot) {
          if (!slot.staffIds.includes(member.id)) slot.staffIds.push(member.id);
        } else {
          byStart.set(key, { startsAt, staffIds: [member.id] });
        }
      }
    }
  }

  return [...byStart.values()].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** Disponibilidad de toda la ventana de reservas (hoy y los días siguientes). */
export function computeAvailability(q: Omit<DayQuery, "date">): DaySlots[] {
  const today = localDateString(q.now, q.config.timezone);
  return Array.from({ length: q.config.bookingWindowDays }, (_, i) => {
    const date = addDaysToDateString(today, i);
    return { date, slots: computeDaySlots({ ...q, date }) };
  });
}

/**
 * Reparte la carga: entre los profesionales libres, el que menos turnos tiene ese día.
 * Desempata por sortOrder (el orden en que llegan en `candidates`).
 */
export function rankStaffByLoad(candidates: string[], dayLoad: ReadonlyMap<string, number>): string[] {
  return candidates
    .map((id, index) => ({ id, index, load: dayLoad.get(id) ?? 0 }))
    .sort((a, b) => a.load - b.load || a.index - b.index)
    .map((c) => c.id);
}
