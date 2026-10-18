"use client";

import { Clapperboard, ImagePlus, Images, Loader2, Pencil, Play, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { addCatalogPhotoAction, deleteCatalogPhotoAction, updateCatalogPhotoAction } from "@/actions/catalog-photos";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { cloudinaryThumb, cloudinaryVideoPoster } from "@/lib/cloudinary-url";
import { ACCEPTED_TYPES, ACCEPTED_VIDEO_TYPES, uploadCatalogPhoto, uploadCatalogVideo } from "@/lib/upload-photo";
import { cn } from "@/lib/utils";
import { EmptyState, FormMessage } from "./ui";

export interface CatalogRow {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  url: string;
  caption: string | null;
  staffId: string | null;
  serviceId: string | null;
}

type Option = { id: string; name: string };

interface Upload {
  id: string;
  name: string;
  video: boolean;
  status: "uploading" | "error";
  error?: string;
}

const thumbOf = (p: Pick<CatalogRow, "mediaType" | "url">, size: number) =>
  p.mediaType === "VIDEO" ? cloudinaryVideoPoster(p.url, size, true) : cloudinaryThumb(p.url, size);

/** Fotos y videos de cortes que se muestran en el apartado público "Catálogo". */
export function CatalogManager({ photos, staff, services }: { photos: CatalogRow[]; staff: Option[]; services: Option[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [author, setAuthor] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [toDelete, setToDelete] = useState<CatalogRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addFiles(files: FileList) {
    setError(null);
    const staffId = author || null;
    const serviceId = service || null;
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const video = file.type.startsWith("video/");
      setUploads((u) => [...u, { id, name: file.name, video, status: "uploading" }]);

      (video ? uploadCatalogVideo(file) : uploadCatalogPhoto(file))
        .then(async (uploaded) => {
          const r = await addCatalogPhotoAction({ ...uploaded, mediaType: video ? "VIDEO" : "IMAGE", staffId, serviceId, caption: "" });
          if (!r.success) throw new Error(r.error);
          setUploads((u) => u.filter((x) => x.id !== id)); // el archivo real llega con el refresco del servidor
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
      setToDelete(null);
      if (!r.success) setError(r.error);
    });
  }

  const nameOf = (list: Option[], id: string | null) => list.find((s) => s.id === id)?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="surface-card grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_16rem] sm:p-6">
        {/* Zona de subida: se puede tocar o arrastrar fotos y videos encima */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-44 flex-col items-center justify-center gap-3 rounded-sm border border-dashed p-6 text-center transition-colors",
            dragging ? "border-ink bg-ink/[0.06]" : "border-ink/20 hover:border-ink/50 hover:bg-ink/[0.03]",
          )}
        >
          <span className="flex items-center gap-2">
            <span className="flex size-12 items-center justify-center rounded-full border border-ink/20">
              <ImagePlus aria-hidden strokeWidth={1.4} className="size-5" />
            </span>
            <span className="flex size-12 items-center justify-center rounded-full border border-ink/20">
              <Clapperboard aria-hidden strokeWidth={1.4} className="size-5" />
            </span>
          </span>
          <span className="font-medium">Subir fotos o videos de cortes</span>
          <span className="text-sm text-muted">Tocá para elegir o arrastralos acá · Fotos JPG, PNG o WebP · Videos MP4, MOV o WebM (máx. 100 MB)</span>
        </button>
        <div className="flex flex-col justify-center gap-4">
          <Field label="¿Qué servicio se hizo?" htmlFor="service">
            <Select id="service" value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">Sin especificar</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="¿Quién hizo el corte?" htmlFor="author" hint="Se aplica a lo que subas ahora">
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
        <input
          ref={inputRef}
          type="file"
          accept={[...ACCEPTED_TYPES, ...ACCEPTED_VIDEO_TYPES].join(",")}
          multiple
          className="sr-only"
          aria-label="Subir fotos o videos al catálogo"
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
                  <Loader2 aria-hidden className="size-4 animate-spin" /> Subiendo {u.video ? "video" : "foto"} {u.name}…
                </span>
              ) : (
                <span className="inline-flex items-center gap-3">
                  {u.name}: {u.error}
                  <button type="button" className="underline underline-offset-4" onClick={() => setUploads((all) => all.filter((x) => x.id !== u.id))}>
                    Descartar
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <FormMessage msg={error ? { ok: false, text: error } : null} />

      {photos.length === 0 ? (
        <EmptyState icon={Images} title="Todavía no hay fotos ni videos" text="Lo que subas aparece en el apartado Catálogo de la página, para que los clientes se inspiren." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="flex flex-col gap-2">
              <div className="group relative aspect-square overflow-hidden rounded-sm border border-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary */}
                <img src={thumbOf(p, 320)} alt={p.caption ?? "Corte del catálogo"} className="size-full object-cover" loading="lazy" />
                {p.mediaType === "VIDEO" && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-ink backdrop-blur">
                    <Play aria-hidden className="size-3 fill-current" /> Video
                  </span>
                )}
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => setEditing(p)} aria-label="Editar" className="flex size-7 items-center justify-center rounded-full bg-cream text-ink">
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setToDelete(p)} aria-label="Eliminar" className="flex size-7 items-center justify-center rounded-full bg-cream text-ink">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="truncate text-sm">{nameOf(services, p.serviceId) ?? p.caption ?? <span className="text-muted">Sin servicio</span>}</p>
              {nameOf(staff, p.staffId) && <p className="-mt-2 truncate text-xs text-muted">por {nameOf(staff, p.staffId)}</p>}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing?.mediaType === "VIDEO" ? "Editar video" : "Editar foto"}>
        {editing && <MediaForm key={editing.id} item={editing} staff={staff} services={services} onDone={() => setEditing(null)} />}
      </Dialog>

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)} title="Eliminar del catálogo">
        <div className="flex flex-col gap-5">
          <p>Se va a eliminar {toDelete?.mediaType === "VIDEO" ? "este video" : "esta foto"} del catálogo y del almacenamiento. No se puede deshacer.</p>
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

function MediaForm({ item, staff, services, onDone }: { item: CatalogRow; staff: Option[]; services: Option[]; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const values = {
      id: item.id,
      caption: formData.get("caption") ?? "",
      staffId: (formData.get("staffId") as string) || null,
      serviceId: (formData.get("serviceId") as string) || null,
    };
    startTransition(async () => {
      const r = await updateCatalogPhotoAction(values);
      if (r.success) onDone();
      else setError(r.error);
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary */}
      <img src={thumbOf(item, 480)} alt="" className="mx-auto aspect-square w-48 rounded-sm object-cover" />
      <Field label="¿Qué servicio se hizo?" htmlFor="serviceId">
        <Select id="serviceId" name="serviceId" defaultValue={item.serviceId ?? ""}>
          <option value="">Sin especificar</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="¿Quién hizo el corte?" htmlFor="staffId">
        <Select id="staffId" name="staffId" defaultValue={item.staffId ?? ""}>
          <option value="">Sin especificar</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Descripción" htmlFor="caption" hint="Opcional. Ej.: Fade con mechas platinadas">
        <Input id="caption" name="caption" defaultValue={item.caption ?? ""} maxLength={80} />
      </Field>
      <FormMessage msg={error ? { ok: false, text: error } : null} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar
      </Button>
    </form>
  );
}
