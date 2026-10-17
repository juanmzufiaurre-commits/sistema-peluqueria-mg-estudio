"use client";

import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { cloudinaryFull, cloudinaryThumb } from "@/lib/cloudinary-url";
import type { AgendaPhoto } from "@/types/admin";

interface Props {
  photos: AgendaPhoto[];
  emptyText?: string;
  /** Si se pasa, cada miniatura muestra un botón para eliminar. */
  onDelete?: (photo: AgendaPhoto) => void;
}

export function PhotoGallery({ photos, emptyText = "El cliente no subió fotos de referencia.", onDelete }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  if (photos.length === 0) return <p className="text-sm text-muted">{emptyText}</p>;

  const current = index === null ? null : photos[index];
  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length));

  return (
    <>
      <ul className="grid grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <li key={p.id} className="relative">
            <button type="button" onClick={() => setIndex(i)} aria-label={`Ver foto ${i + 1}`} className="aspect-square w-full overflow-hidden rounded-sm border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary */}
              <img src={cloudinaryThumb(p.url, 240)} alt={`Foto ${i + 1}`} className="size-full object-cover" loading="lazy" />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(p)}
                aria-label={`Eliminar foto ${i + 1}`}
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-cream text-ink"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={current !== null} onClose={() => setIndex(null)} title="Foto ampliada" variant="plain">
        {current && (
          <div className="flex items-center gap-2">
            {photos.length > 1 && (
              <button type="button" onClick={() => step(-1)} aria-label="Anterior" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream">
                <ChevronLeft />
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen remota de Cloudinary */}
            <img src={cloudinaryFull(current.url)} alt="Foto ampliada" className="max-h-[86dvh] max-w-full object-contain" />
            {photos.length > 1 && (
              <button type="button" onClick={() => step(1)} aria-label="Siguiente" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream">
                <ChevronRight />
              </button>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
