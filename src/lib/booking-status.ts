// Seguro para cliente y servidor: no importa Prisma.
export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED_BY_ADMIN",
  "CANCELLED_BY_CLIENT",
] as const;

export type BookingStatusValue = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABEL: Record<BookingStatusValue, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
  CANCELLED_BY_ADMIN: "Canceló local",
  CANCELLED_BY_CLIENT: "Canceló cliente",
};

/** Clases de Tailwind (tokens st-* de globals.css) para la etiqueta de cada estado. */
export const STATUS_CLASS: Record<BookingStatusValue, string> = {
  PENDING: "bg-st-pending/15 text-st-pending",
  CONFIRMED: "bg-st-confirmed/15 text-st-confirmed",
  IN_PROGRESS: "bg-st-progress/15 text-st-progress",
  COMPLETED: "bg-st-done/15 text-st-done",
  NO_SHOW: "bg-st-noshow/15 text-st-noshow",
  CANCELLED_BY_ADMIN: "bg-st-cancelled/15 text-st-cancelled",
  CANCELLED_BY_CLIENT: "bg-st-cancelled/15 text-st-cancelled",
};

/** Color sólido de cada estado (punto y línea lateral de la tarjeta en la agenda). */
export const STATUS_DOT: Record<BookingStatusValue, string> = {
  PENDING: "bg-st-pending",
  CONFIRMED: "bg-st-confirmed",
  IN_PROGRESS: "bg-st-progress",
  COMPLETED: "bg-st-done",
  NO_SHOW: "bg-st-noshow",
  CANCELLED_BY_ADMIN: "bg-st-cancelled",
  CANCELLED_BY_CLIENT: "bg-st-cancelled",
};

/** Estados que ocupan agenda (bloquean el horario). */
export const ACTIVE: readonly BookingStatusValue[] = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

/** Estados que cuentan para facturación estimada. */
export const REVENUE: readonly BookingStatusValue[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

export const isCancelled = (s: BookingStatusValue): boolean => s === "CANCELLED_BY_ADMIN" || s === "CANCELLED_BY_CLIENT";
