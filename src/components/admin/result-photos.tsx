"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { addResultPhotoAction, deleteResultPhotoAction } from "@/actions/admin-photos";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatLongDate } from "@/lib/format";
import { MAX_RESULT_PHOTOS as MAX } from "@/lib/photo-limits";
import { ACCEPTED_TYPES, uploadResultPhoto } from "@/lib/upload-photo";
import type { AgendaBooking, AgendaPhoto } from "@/types/admin";
import { PhotoGallery } from "./photo-gallery";


interface Upload {
  id: string;
  status: "uploading" | "error";
  error?: string;
}

/** Fotos del resultado final de este turno + resultados de visitas anteriores del mismo cliente. */
export function ResultPhotos({ booking: b }: { booking: AgendaBooking }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [toDelete, setToDelete] = useState<AgendaPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = b.photos.filter((p) => p.kind === "RESULT");
  const previous = b.client.resultPhotos.filter((p) => p.bookingId !== b.id);
  const inFlight = uploads.filter((u) => u.status === "uploading").length;
  const room = MAX - current.length - inFlight;

  function addFiles(files: FileList) {
    setError(null);
    for (const file of Array.from(files).slice(0, Math.max(0, room))) {
      const id = crypto.randomUUID();
      setUploads((u) => [...u, { id, status: "uploading" }]);

      uploadResultPhoto(file)
        .then(async (uploaded) => {
          const r = await addResultPhotoAction({ bookingId: b.id, ...uploaded });
          if (!r.success) throw new Error(r.error);
          setUploads((u) => u.filter((x) => x.id !== id)); // la foto real llega con el refresco del servidor
        })
        .catch((e: unknown) =>
          setUploads((u) => u.map((x) => (x.id === id ? { ...x, status: "error", error: e instanceof Error ? e.message : "Error al subir" } : x))),
        );
    }
  }

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const r = await deleteResultPhotoAction(toDelete.id);
      if (r.success) setToDelete(null);
      else setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <PhotoGallery photos={current} emptyText="Todavía no cargaste fotos del resultado de este turno." onDelete={setToDelete} />

        {uploads.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {uploads.map((u) => (
              <li key={u.id} className={u.status === "error" ? "text-st-cancelled" : "text-muted"}>
                {u.status === "uploading" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 aria-hidden className="size-4 animate-spin" /> Subiendo foto…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-3">
                    {u.error}
                    <button type="button" className="underline underline-offset-4" onClick={() => setUploads((all) => all.filter((x) => x.id !== u.id))}>
                      Descartar
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-sm text-st-cancelled">
            {error}
          </p>
        )}

        <div>
          <Button variant="outline" size="sm" disabled={room <= 0} onClick={() => inputRef.current?.click()}>
            <ImagePlus aria-hidden className="size-4" /> Subir fotos del resultado
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="sr-only"
            aria-label="Subir fotos del resultado"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {room <= 0 && <span className="ml-3 text-sm text-muted">Máximo {MAX} por turno</span>}
        </div>
      </div>

      {previous.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium">Resultados anteriores</p>
          <PhotoGallery photos={previous.map((p) => ({ id: p.id, url: p.url, kind: "RESULT" as const }))} />
          <p className="mt-2 text-xs text-muted">
            Desde {formatLongDate(previous[previous.length - 1].startsAt)} hasta {formatLongDate(previous[0].startsAt)}
          </p>
        </div>
      )}

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)} title="Eliminar foto">
        <div className="flex flex-col gap-5">
          <p>Se va a eliminar esta foto del resultado y del almacenamiento. No se puede deshacer.</p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setToDelete(null)} disabled={pending}>
              Volver
            </Button>
            <Button className="flex-1 bg-st-cancelled hover:bg-st-cancelled/90" onClick={confirmDelete} disabled={pending}>
              {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Eliminar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
