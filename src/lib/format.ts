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

const shortDateFmt = new Intl.DateTimeFormat("es-AR", { timeZone: APP_TIMEZONE, day: "numeric", month: "short", year: "numeric" });
/** "20 oct 2026" */
export const formatShortDate = (iso: string): string =>
  shortDateFmt
    .format(new Date(iso))
    .replace(/\./g, "")
    .replace(/ de /g, " ");

/** Cuánto pasó, en palabras: "hoy", "ayer", "hace 12 días", "hace 3 meses", "hace 1 año". */
export function formatAgo(days: number): string {
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "hace 1 año" : `hace ${years} años`;
}

/** +5491122334455 -> "11 2233-4455" (los demás códigos de área: "351 123-4567"). */
export function formatPhone(e164: string): string {
  const local = e164.replace(/^\+549/, "");
  if (!/^\d{10}$/.test(local)) return e164;
  return local.startsWith("11") ? `11 ${local.slice(2, 6)}-${local.slice(6)}` : `${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
}
