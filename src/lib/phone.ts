/**
 * Normaliza teléfonos argentinos a E.164 móvil: +549 + 10 dígitos (área + abonado).
 * Acepta: "11 2345-6789", "011 15 2345-6789", "+54 9 11 2345 6789", "5491123456789",
 * "0351 15 123 4567", etc. Devuelve null si no se puede interpretar como móvil argentino.
 */
export function normalizeArgentinePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.startsWith("54")) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = digits.slice(1); // prefijo de móvil internacional
  }

  if (digits.startsWith("0")) digits = digits.slice(1); // prefijo troncal

  // Prefijo "15" entre el código de área (2 a 4 dígitos) y el abonado: 12 dígitos en total.
  if (digits.length === 12) {
    for (const areaLength of [2, 3, 4]) {
      if (digits.slice(areaLength, areaLength + 2) === "15") {
        digits = digits.slice(0, areaLength) + digits.slice(areaLength + 2);
        break;
      }
    }
  }

  if (!/^[1-9]\d{9}$/.test(digits)) return null;
  return `+549${digits}`;
}

/** +5491123456789 -> 5491123456789, formato que espera wa.me. */
export const toWaMeNumber = (e164: string): string => e164.replace(/^\+/, "");
