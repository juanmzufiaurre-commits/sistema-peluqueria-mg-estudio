"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { MAX_REFERENCE_PHOTOS } from "@/lib/validation/booking";
import { ACCEPTED_TYPES, uploadReferencePhoto, type UploadedPhoto } from "@/lib/upload-photo";
import { cn } from "@/lib/utils";

export interface PhotoItem {
  id: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  uploaded?: UploadedPhoto;
  error?: string;
}

interface Props {
  photos: PhotoItem[];
  onChange: (updater: (prev: PhotoItem[]) => PhotoItem[]) => void;
}

export function PhotoDropzone({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const remaining = MAX_REFERENCE_PHOTOS - photos.length;

  function addFiles(files: FileList | File[]) {
    const picked = Array.from(files).slice(0, remaining);
    for (const file of picked) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      onChange((prev) => [...prev, { id, previewUrl, status: "uploading" }]);

      uploadReferencePhoto(file)
        .then((uploaded) => onChange((prev) => prev.map((p) => (p.id === id ? { ...p, status: "done", uploaded } : p))))
        .catch((e: unknown) =>
          onChange((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "error", error: e instanceof Error ? e.message : "Error al subir" } : p)),
          ),
        );
    }
  }

  function remove(id: string) {
    onChange((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (remaining > 0) addFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-3">
      {remaining > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center gap-2 rounded-sm border border-dashed border-ink/40 px-4 py-6 text-center transition-colors",
            dragging && "border-ink bg-cream-deep",
          )}
        >
          <ImagePlus aria-hidden className="size-6" strokeWidth={1.25} />
          <button type="button" onClick={() => inputRef.current?.click()} className="text-sm underline underline-offset-4">
            Subir fotos de referencia
          </button>
          <p className="text-sm text-muted">Hasta {MAX_REFERENCE_PHOTOS} fotos · JPG, PNG o WebP</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="sr-only"
            aria-label="Subir fotos de referencia"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3">
          {photos.map((p) => (
            <li key={p.id} className="relative aspect-square overflow-hidden rounded-sm border border-line bg-cream-deep">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
              <img src={p.previewUrl} alt="Foto de referencia" className="size-full object-cover" />
              {p.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-cream/70">
                  <Loader2 aria-label="Subiendo" className="size-5 animate-spin" />
                </div>
              )}
              {p.status === "error" && (
                <p className="absolute inset-x-0 bottom-0 bg-st-cancelled px-2 py-1 text-xs text-cream">{p.error}</p>
              )}
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-sm bg-ink text-cream"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
