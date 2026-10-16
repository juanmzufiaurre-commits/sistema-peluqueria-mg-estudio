-- Anti doble-booking a nivel de base de datos (RNF05).
-- Un mismo profesional no puede tener dos turnos activos con rangos [start, end) solapados.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startDatetime", "endDatetime", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS'));

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_end_after_start CHECK ("endDatetime" > "startDatetime");

ALTER TABLE "SystemConfig"
  ADD CONSTRAINT system_config_singleton CHECK ("id" = 1);
