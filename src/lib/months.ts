// Meses como "yyyy-MM" (seguro para cliente y servidor).

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export const isMonthString = (s: string): boolean => MONTH_RE.test(s);

/** "2026-01" + (-1) → "2025-12" */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Primer y último día del mes ("yyyy-MM-dd"). */
export function monthBounds(month: string): { first: string; last: string } {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { first: `${month}-01`, last: `${month}-${String(lastDay).padStart(2, "0")}` };
}

/** Meses desde `from` hasta `to` inclusive, en orden. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

const longFmt = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", month: "short" });

/** "octubre de 2026" */
export const monthLabel = (month: string): string => longFmt.format(new Date(`${month}-15T12:00:00Z`));
/** "oct" */
export const monthShort = (month: string): string => shortFmt.format(new Date(`${month}-15T12:00:00Z`)).replace(".", "");
