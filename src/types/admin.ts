import type { BookingStatusValue } from "@/lib/booking-status";

// DTOs serializables (fechas en ISO) que viajan del servidor a los componentes cliente del panel.

export interface AgendaPhoto {
  id: string;
  url: string;
  kind: "REFERENCE" | "RESULT";
}

export interface AgendaNote {
  id: string;
  body: string;
  createdAt: string;
}

export interface ClientHistoryEntry {
  bookingId: string;
  startsAt: string;
  serviceName: string;
  status: BookingStatusValue;
}

export interface AgendaClient {
  id: string;
  firstName: string;
  lastName: string | null;
  phoneE164: string;
  visits: number; // turnos completados
  noShows: number;
  favoriteService: string | null;
  history: ClientHistoryEntry[]; // otros turnos, más recientes primero
  notes: AgendaNote[];
}

export interface AgendaBooking {
  id: string;
  publicCode: string;
  startsAt: string;
  endsAt: string; // incluye el buffer
  durationMinutes: number;
  serviceName: string;
  priceArs: number;
  status: BookingStatusValue;
  staffName: string;
  client: AgendaClient;
  photos: AgendaPhoto[];
}

export interface DayCount {
  date: string; // yyyy-MM-dd
  count: number;
}

export interface DayMetrics {
  date: string;
  totalBookings: number;
  revenueArs: number;
  occupancy: number; // 0..1
}
