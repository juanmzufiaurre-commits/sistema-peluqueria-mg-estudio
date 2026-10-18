-- Catálogo: videos además de fotos y el servicio que se le hizo al cliente.
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

ALTER TABLE "CatalogPhoto"
  ADD COLUMN "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
  ADD COLUMN "serviceId" TEXT;

ALTER TABLE "CatalogPhoto" ADD CONSTRAINT "CatalogPhoto_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Varios certificados por profesional (nombre + academia), en lugar de un texto suelto.
CREATE TABLE "StaffCertificate" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academy" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StaffCertificate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffCertificate_staffId_sortOrder_idx" ON "StaffCertificate"("staffId", "sortOrder");

ALTER TABLE "StaffCertificate" ADD CONSTRAINT "StaffCertificate_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- El certificado que ya estaba cargado pasa a ser el primero de la lista (sin academia conocida).
INSERT INTO "StaffCertificate" ("id", "staffId", "name", "academy", "sortOrder")
SELECT 'migr_' || "id", "id", "certificate", '', 0 FROM "Staff" WHERE "certificate" IS NOT NULL AND "certificate" <> '';

ALTER TABLE "Staff" DROP COLUMN "certificate";

ALTER TABLE "StaffCertificate" ENABLE ROW LEVEL SECURITY;
