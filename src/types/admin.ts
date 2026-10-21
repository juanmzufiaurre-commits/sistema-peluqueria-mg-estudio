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

export interface ClientResultPhoto {
  id: string;
  url: string;
  bookingId: string;
  startsAt: string; // fecha del turno al que pertenece
  serviceName: string;
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
  /** Fotos del resultado de todos sus turnos, más recientes primero. */
  resultPhotos: ClientResultPhoto[];
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

/** Una fila de la base de clientes (sección Clientes del panel). */
export interface ClientListRow {
  id: string;
  firstName: string;
  lastName: string | null;
  phoneE164: string;
  createdAt: string; // cliente desde: su primer turno o cuándo se registró, lo que sea antes
  visits: number; // turnos completados
  noShows: number;
  spentArs: number;
  lastVisitAt: string | null;
  daysSinceLastVisit: number | null;
  nextBookingAt: string | null;
  favoriteService: string | null;
  inactive: boolean; // vino, no tiene turno y hace más de 60 días que no viene
}

export interface ClientsSummary {
  total: number;
  newThisMonth: number;
  regulars: number; // 3 visitas o más
  inactive: number;
}

export interface ClientBookingEntry {
  id: string;
  publicCode: string;
  startsAt: string;
  serviceName: string;
  staffName: string;
  priceArs: number;
  status: BookingStatusValue;
  upcoming: boolean; // todavía no pasó
}

export interface ClientDetail extends ClientListRow {
  cancellations: number;
  firstVisitAt: string | null;
  favoriteStaff: string | null;
  bookings: ClientBookingEntry[]; // todos, más recientes primero
  notes: AgendaNote[];
  resultPhotos: AgendaPhoto[];
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
