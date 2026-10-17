"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";

interface BookingFlow {
  /** true cuando el cliente ya reservó y está viendo el comprobante. */
  finished: boolean;
  setFinished: (value: boolean) => void;
}

const BookingFlowContext = createContext<BookingFlow | null>(null);

/** Comparte entre la portada y el asistente de reserva si el turno ya fue confirmado. */
export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [finished, setFinished] = useState(false);
  return <BookingFlowContext value={{ finished, setFinished }}>{children}</BookingFlowContext>;
}

export function useBookingFlow(): BookingFlow {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) throw new Error("useBookingFlow debe usarse dentro de BookingFlowProvider");
  return ctx;
}

/** Botón "Reservar turno" de la portada: desaparece una vez confirmada la reserva. */
export function ReserveButton() {
  const { finished } = useBookingFlow();
  if (finished) return null;
  return (
    <ButtonLink href="#reservar" size="lg" className="mt-4">
      Reservar turno
    </ButtonLink>
  );
}
