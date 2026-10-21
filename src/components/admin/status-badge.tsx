import { STATUS_CLASS, STATUS_DOT, STATUS_LABEL, type BookingStatusValue } from "@/lib/booking-status";
import { cn } from "@/lib/utils";

/** Etiqueta de color con el estado del turno (Pendiente, Confirmado, …). */
export function StatusBadge({ status }: { status: BookingStatusValue }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.1em]", STATUS_CLASS[status])}>
      <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
