// Semanas de lunes a domingo, identificadas por su lunes "yyyy-MM-dd" (seguro para cliente y servidor).
import { addDaysToDateString, isDateString, weekdayOfDateString } from "./dates";

/** Lunes de la semana de `date`. */
export function weekStart(date: string): string {
  const weekday = weekdayOfDateString(date); // 0 = domingo
  return addDaysToDateString(date, weekday === 0 ? -6 : 1 - weekday);
}

export const isWeekStart = (s: string): boolean => isDateString(s) && weekStart(s) === s;

export const addWeeks = (monday: string, delta: number): string => addDaysToDateString(monday, delta * 7);

/** Los 7 días de la semana, de lunes a domingo. */
export const weekDays = (monday: string): string[] => Array.from({ length: 7 }, (_, i) => addDaysToDateString(monday, i));

/** Semanas desde `from` hasta `to` (lunes), inclusive. */
export function weekRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let w = from; w <= to; w = addWeeks(w, 1)) out.push(w);
  return out;
}

const dayMonth = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", day: "numeric", month: "short" });
const fmt = (d: string) => dayMonth.format(new Date(`${d}T12:00:00Z`)).replace(".", "");

/** "12 oct – 18 oct" */
export const weekLabel = (monday: string): string => `${fmt(monday)} – ${fmt(addDaysToDateString(monday, 6))}`;
