import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIMEZONE = "America/Argentina/Buenos_Aires";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isDateString = (s: string): boolean => DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
export const isTimeString = (s: string): boolean => TIME_RE.test(s);

/** "yyyy-MM-dd" del instante `d` en la zona dada. */
export const localDateString = (d: Date, tz: string = APP_TIMEZONE): string => formatInTimeZone(d, tz, "yyyy-MM-dd");

/** "HH:mm" del instante `d` en la zona dada. */
export const localTimeString = (d: Date, tz: string = APP_TIMEZONE): string => formatInTimeZone(d, tz, "HH:mm");

/** Instante UTC que corresponde a la fecha y hora de pared en la zona dada. */
export function zonedToUtc(dateStr: string, time: string, tz: string = APP_TIMEZONE): Date {
  return fromZonedTime(`${dateStr}T${time}:00`, tz);
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado, independiente de la zona horaria del servidor. */
export const weekdayOfDateString = (dateStr: string): number => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Límites [start, end) del día local en UTC. */
export function dayBoundsUtc(dateStr: string, tz: string = APP_TIMEZONE): { start: Date; end: Date } {
  return { start: zonedToUtc(dateStr, "00:00", tz), end: zonedToUtc(addDaysToDateString(dateStr, 1), "00:00", tz) };
}

export const addMinutes = (d: Date, minutes: number): Date => new Date(d.getTime() + minutes * 60_000);
