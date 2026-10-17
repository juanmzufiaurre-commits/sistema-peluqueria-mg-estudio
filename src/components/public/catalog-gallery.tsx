"use client";

import { ChevronLeft, ChevronRight, Scissors } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cloudinaryFull, cloudinaryWidth } from "@/lib/cloudinary-url";
import { cn } from "@/lib/utils";
import type { PublicCatalogPhoto } from "@/server/services/team";

/** Mosaico de cortes con filtro por profesional y vista ampliada. */
export function CatalogGallery({ photos }: { photos: PublicCatalogPhoto[] }) {
  const [staffId, setStaffId] = useState<string | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-sm border border-dashed border-line px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-sm border border-line">
          <Scissors aria-hidden strokeWidth={1.4} className="size-6 text-ink-soft" />
        </span>
        <p className="max-w-xs text-ink-soft">Muy pronto vas a ver acá los trabajos del estudio.</p>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Agendar turno
        </Link>
      </div>
    );
  }

  const authors = [...new Map(photos.filter((p) => p.staffId && p.staffName).map((p) => [p.staffId!, p.staffName!])).entries()];
  const visible = staffId ? photos.filter((p) => p.staffId === staffId) : photos;
  const current = index === null ? null : visible[index];
  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length));

  return (
    <>
      {authors.length > 1 && (
        <div role="group" aria-label="Filtrar por profesional" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
          {[[null, "Todos"] as const, ...authors].map(([id, name]) => (
            <button
              key={id ?? "all"}
              type="button"
              aria-pressed={staffId === id}
              onClick={() => setStaffId(id)}
              className={cn(
                "shrink-0 rounded-sm border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors",
                staffId === id ? "border-ink bg-ink text-cream" : "border-line text-ink-soft hover:border-ink-soft",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <ul className="columns-2 gap-2 sm:columns-3 sm:gap-3">
        {visible.map((p, i) => (
          <li key={p.id} className="mb-2 break-inside-avoid sm:mb-3">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver ${p.caption ?? `corte ${i + 1}`}`}
              className="group relative block w-full overflow-hidden rounded-sm border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen ya optimizada por Cloudinary */}
              <img src={cloudinaryWidth(p.url, 600)} alt={p.caption ?? `Corte ${i + 1}`} loading="lazy" className="w-full transition duration-500 group-hover:scale-[1.03]" />
              {(p.caption || p.staffName) && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-left opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  {p.caption && <span className="block text-sm text-ink">{p.caption}</span>}
                  {p.staffName && <span className="block text-xs text-ink-soft">por {p.staffName}</span>}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={current !== null} onClose={() => setIndex(null)} title="Corte ampliado" variant="plain">
        {current && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              {visible.length > 1 && (
                <button type="button" onClick={() => step(-1)} aria-label="Anterior" className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-cream">
                  <ChevronLeft />
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen remota de Cloudinary */}
              <img src={cloudinaryFull(current.url)} alt={current.caption ?? "Corte ampliado"} className="max-h-[74dvh] max-w-full rounded-sm object-contain" />
              {visible.length > 1 && (
                <button type="button" onClick={() => step(1)} aria-label="Siguiente" className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-cream">
                  <ChevronRight />
                </button>
              )}
            </div>
            <div className="text-center">
              {current.caption && <p className="text-xl font-medium">{current.caption}</p>}
              {current.staffName && <p className="text-sm text-ink-soft">por {current.staffName}</p>}
            </div>
            <Link href="/" onClick={() => setIndex(null)} className={buttonVariants({ size: "sm" })}>
              Quiero este corte
            </Link>
          </div>
        )}
      </Dialog>
    </>
  );
}
