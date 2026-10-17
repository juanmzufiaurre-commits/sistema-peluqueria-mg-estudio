"use client";

import { ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { addCatalogPhotoAction, deleteCatalogPhotoAction, updateCatalogPhotoAction } from "@/actions/catalog-photos";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { cloudinaryThumb } from "@/lib/cloudinary-url";
import { ACCEPTED_TYPES, uploadCatalogPhoto } from "@/lib/upload-photo";

export interface CatalogRow {
  id: string;
  url: string;
  caption: string | null;
  staffId: string | null;
}

interface Upload {
  id: string;
  status: "uploading" | "error";
  error?: string;
}

/** Fotos de cortes que se muestran en el apartado público "Catálogo". */
export function CatalogManager({ photos, staff }: { photos: CatalogRow[]; staff: { id: string; name: string }[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [author, setAuthor] = useState<string>("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [toDelete, setToDelete] = useState<CatalogRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addFiles(files: FileList) {
    setError(null);
    const staffId = author || null;
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      setUploads((u) => [...u, { id, status: "uploading" }]);

      uploadCatalogPhoto(file)
        .then(async (uploaded) => {
          const r = await addCatalogPhotoAction({ ...uploaded, staffId, caption: "" });
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
      const r = await deleteCatalogPhotoAction(toDelete.id);
      if (r.success) setToDelete(null);
      else {
        setToDelete(null);
        setError(r.error);
      }
    });
  }

  const nameOf = (id: string | null) => staff.find((s) => s.id === id)?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-sm border border-line bg-surface p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="¿Quién hizo el corte?" htmlFor="author" hint="Se aplica a las fotos que subas ahora">
            <Select id="author" value={author} onChange={(e) => setAuthor(e.target.value)}>
              <option value="">Sin especificar</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button onClick={() => inputRef.current?.click()}>
          <ImagePlus aria-hidden className="size-4" /> Subir fotos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="sr-only"
          aria-label="Subir fotos al catálogo"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

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

      {photos.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay fotos en el catálogo.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="flex flex-col gap-2">
              <div className="relative aspect-square overflow-hidden rounded-sm border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary */}
                <img src={cloudinaryThumb(p.url, 320)} alt={p.caption ?? "Corte del catálogo"} className="size-full object-cover" loading="lazy" />
                <div className="absolute right-1 top-1 flex gap-1">
                  <button type="button" onClick={() => setEditing(p)} aria-label="Editar foto" className="flex size-7 items-center justify-center rounded-full bg-cream text-ink">
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setToDelete(p)} aria-label="Eliminar foto" className="flex size-7 items-center justify-center rounded-full bg-cream text-ink">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="truncate text-sm">{p.caption ?? <span className="text-muted">Sin descripción</span>}</p>
              {nameOf(p.staffId) && <p className="-mt-2 truncate text-xs text-muted">por {nameOf(p.staffId)}</p>}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Editar foto">
        {editing && <PhotoForm key={editing.id} photo={editing} staff={staff} onDone={() => setEditing(null)} />}
      </Dialog>

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)} title="Eliminar foto">
        <div className="flex flex-col gap-5">
          <p>Se va a eliminar esta foto del catálogo y del almacenamiento. No se puede deshacer.</p>
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

function PhotoForm({ photo, staff, onDone }: { photo: CatalogRow; staff: { id: string; name: string }[]; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const values = { id: photo.id, caption: formData.get("caption") ?? "", staffId: (formData.get("staffId") as string) || null };
    startTransition(async () => {
      const r = await updateCatalogPhotoAction(values);
      if (r.success) onDone();
      else setError(r.error);
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary */}
      <img src={cloudinaryThumb(photo.url, 480)} alt="" className="mx-auto aspect-square w-48 rounded-sm object-cover" />
      <Field label="Descripción" htmlFor="caption" hint="Opcional. Ej.: Fade con mechas platinadas">
        <Input id="caption" name="caption" defaultValue={photo.caption ?? ""} maxLength={80} />
      </Field>
      <Field label="¿Quién hizo el corte?" htmlFor="staffId">
        <Select id="staffId" name="staffId" defaultValue={photo.staffId ?? ""}>
          <option value="">Sin especificar</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      {error && (
        <p role="alert" className="text-sm text-st-cancelled">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar
      </Button>
    </form>
  );
}
