import { APP_TIMEZONE } from "./dates";

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const formatArs = (amount: number): string => ars.format(amount);

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const timeFmt = new Intl.DateTimeFormat("es-AR", { timeZone: APP_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const formatTime = (iso: string): string => timeFmt.format(new Date(iso));

const longDateFmt = new Intl.DateTimeFormat("es-AR", { timeZone: APP_TIMEZONE, weekday: "long", day: "numeric", month: "long" });
const ucFirst = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** "Sábado, 17 de octubre" */
export const formatLongDate = (iso: string): string => ucFirst(longDateFmt.format(new Date(iso)));

const dayFmt = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });

/** "yyyy-MM-dd" -> partes para el carrusel de días: { weekday: "lun", day: "7", month: "ene" } */
export function dayParts(dateStr: string): { weekday: string; day: string; month: string } {
  const parts = dayFmt.formatToParts(new Date(`${dateStr}T12:00:00Z`));
  const get = (type: string) => (parts.find((p) => p.type === type)?.value ?? "").replace(".", "");
  return { weekday: get("weekday"), day: get("day"), month: get("month") };
}

const arsAmount = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
/** Solo el número, sin el símbolo: "16.000". Para dibujar el "$" aparte (ver <Price>). */
export const formatArsAmount = (amount: number): string => arsAmount.format(amount);
