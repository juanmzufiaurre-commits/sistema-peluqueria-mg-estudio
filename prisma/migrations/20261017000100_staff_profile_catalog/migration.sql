-- Perfil público de los profesionales y catálogo de cortes.
ALTER TABLE "Staff"
  ADD COLUMN "role" TEXT,
  ADD COLUMN "instagram" TEXT,
  ADD COLUMN "photoUrl" TEXT,
  ADD COLUMN "photoPublicId" TEXT,
  ADD COLUMN "certificate" TEXT;

CREATE UNIQUE INDEX "Staff_photoPublicId_key" ON "Staff"("photoPublicId");

CREATE TABLE "CatalogPhoto" (
    "id" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "caption" TEXT,
    "staffId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogPhoto_publicId_key" ON "CatalogPhoto"("publicId");
CREATE INDEX "CatalogPhoto_createdAt_idx" ON "CatalogPhoto"("createdAt");

ALTER TABLE "CatalogPhoto" ADD CONSTRAINT "CatalogPhoto_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Igual que el resto de las tablas: sin acceso por la API pública de Supabase.
ALTER TABLE "CatalogPhoto" ENABLE ROW LEVEL SECURITY;
