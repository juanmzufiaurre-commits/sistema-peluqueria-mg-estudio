"use client";

import { BadgeCheck, ImagePlus, Loader2, Pencil, Trash2, UserRound } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { removeStaffPhotoAction, setStaffPhotoAction, updateStaffProfileAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { cloudinaryThumb } from "@/lib/cloudinary-url";
import { ACCEPTED_TYPES, uploadStaffPhoto } from "@/lib/upload-photo";

export interface StaffRow {
  id: string;
  name: string;
  role: string | null;
  instagram: string | null;
  photoUrl: string | null;
  certificate: string | null;
}

/** Perfil público de cada profesional: lo que se ve en el apartado "Profesionales". */
export function StaffManager({ staff }: { staff: StaffRow[] }) {
  const [editing, setEditing] = useState<StaffRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft">Esto es lo que ven los clientes en el apartado Profesionales de la página.</p>

      <ul className="flex flex-col gap-3">
        {staff.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-4 rounded-sm border border-line bg-surface p-4">
            <StaffPhoto staff={s} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-semibold">{s.name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                {s.role && <span>{s.role}</span>}
                {s.instagram && (
                  <span className="inline-flex items-center gap-1">
                    <InstagramIcon className="size-3.5" />@{s.instagram}
                  </span>
                )}
                {s.certificate && (
                  <span className="inline-flex items-center gap-1">
                    <BadgeCheck aria-hidden className="size-3.5" /> Certificado
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
              <Pencil aria-hidden className="size-4" /> Editar
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Editar profesional">
        {editing && <StaffForm key={editing.id} staff={editing} onDone={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}

function StaffPhoto({ staff }: { staff: StaffRow }) {
  return (
    <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-cream-deep">
      {staff.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary
        <img src={cloudinaryThumb(staff.photoUrl, 160)} alt={`Foto de ${staff.name}`} className="size-full object-cover" />
      ) : (
        <UserRound aria-hidden strokeWidth={1.3} className="size-7 text-muted" />
      )}
    </span>
  );
}

function StaffForm({ staff, onDone }: { staff: StaffRow; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(staff.photoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changePhoto(file: File) {
    setError(null);
    setUploading(true);
    uploadStaffPhoto(file)
      .then(async (uploaded) => {
        const r = await setStaffPhotoAction({ staffId: staff.id, ...uploaded });
        if (!r.success) throw new Error(r.error);
        setPhotoUrl(uploaded.secureUrl);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error al subir la foto"))
      .finally(() => setUploading(false));
  }

  function removePhoto() {
    setError(null);
    startTransition(async () => {
      const r = await removeStaffPhotoAction(staff.id);
      if (r.success) setPhotoUrl(null);
      else setError(r.error);
    });
  }

  function submit(formData: FormData) {
    setError(null);
    const values = {
      name: formData.get("name"),
      role: formData.get("role") ?? "",
      instagram: formData.get("instagram") ?? "",
      certificate: formData.get("certificate") ?? "",
    };
    startTransition(async () => {
      const r = await updateStaffProfileAction(staff.id, values);
      if (r.success) onDone();
      else setError(r.error);
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <StaffPhoto staff={{ ...staff, photoUrl }} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={uploading || pending} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <ImagePlus aria-hidden className="size-4" />}
            {photoUrl ? "Cambiar foto" : "Subir foto"}
          </Button>
          {photoUrl && (
            <Button variant="ghost" size="sm" className="text-st-cancelled hover:bg-st-cancelled/10" disabled={uploading || pending} onClick={removePhoto}>
              <Trash2 aria-hidden className="size-4" /> Quitar
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          aria-label="Subir foto del profesional"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) changePhoto(file);
            e.target.value = "";
          }}
        />
      </div>

      <Field label="Nombre" htmlFor="name">
        <Input id="name" name="name" defaultValue={staff.name} required maxLength={40} />
      </Field>
      <Field label="Especialidad" htmlFor="role" hint="Opcional. Ej.: Barbero, Colorista">
        <Input id="role" name="role" defaultValue={staff.role ?? ""} maxLength={40} />
      </Field>
      <Field label="Instagram" htmlFor="instagram" hint="Opcional. El usuario o el enlace al perfil">
        <Input id="instagram" name="instagram" defaultValue={staff.instagram ? `@${staff.instagram}` : ""} maxLength={80} placeholder="@usuario" />
      </Field>
      <Field label="Certificado" htmlFor="certificate" hint="Opcional. Ej.: Certificado en colorimetría — Academia X">
        <Input id="certificate" name="certificate" defaultValue={staff.certificate ?? ""} maxLength={120} />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-st-cancelled">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending || uploading}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar
      </Button>
    </form>
  );
}
