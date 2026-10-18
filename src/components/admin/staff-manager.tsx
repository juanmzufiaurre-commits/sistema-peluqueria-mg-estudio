"use client";

import { BadgeCheck, GraduationCap, ImagePlus, Loader2, Pencil, Plus, Trash2, UserMinus, UserPlus, UserRound, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { createStaffAction, removeStaffAction, removeStaffPhotoAction, setStaffPhotoAction, updateStaffProfileAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { cloudinaryThumb } from "@/lib/cloudinary-url";
import { ACCEPTED_TYPES, uploadStaffPhoto } from "@/lib/upload-photo";
import { cn } from "@/lib/utils";
import { MAX_CERTIFICATES } from "@/lib/validation/staff";
import { FormMessage } from "./ui";

export interface StaffCertificateRow {
  name: string;
  academy: string;
}

export interface StaffRow {
  id: string;
  name: string;
  role: string | null;
  instagram: string | null;
  photoUrl: string | null;
  certificates: StaffCertificateRow[];
}

/** Perfil público de cada profesional (lo que se ve en "Profesionales") y alta/baja del equipo. */
export function StaffManager({ staff }: { staff: StaffRow[] }) {
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState<StaffRow | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {staff.length} {staff.length === 1 ? "profesional" : "profesionales"} en el equipo
        </p>
        <Button size="sm" onClick={() => setAdding(true)}>
          <UserPlus aria-hidden className="size-4" /> Sumar profesional
        </Button>
      </div>

      <FormMessage msg={msg} />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {staff.map((s) => (
          <li key={s.id} className="surface-card flex flex-col items-center gap-4 p-6 text-center">
            <StaffPhoto staff={s} size="lg" />
            <div className="min-w-0">
              <p className="text-lg font-medium tracking-tight">{s.name}</p>
              <p className="label-wide mt-1 text-muted">{s.role ?? "Sin especialidad"}</p>
            </div>
            <ul className="flex w-full flex-col gap-1.5 text-sm text-ink-soft">
              <li className="inline-flex items-center justify-center gap-1.5">
                <InstagramIcon className="size-3.5" />
                {s.instagram ? `@${s.instagram}` : <span className="text-muted">Sin Instagram</span>}
              </li>
              <li className="inline-flex items-center justify-center gap-1.5">
                <BadgeCheck aria-hidden className="size-3.5" />
                {s.certificates.length > 0 ? (
                  `${s.certificates.length} ${s.certificates.length === 1 ? "certificado" : "certificados"}`
                ) : (
                  <span className="text-muted">Sin certificados</span>
                )}
              </li>
            </ul>
            <div className="mt-auto flex w-full gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(s)}>
                <Pencil aria-hidden className="size-4" /> Editar perfil
              </Button>
              {staff.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-st-cancelled hover:bg-st-cancelled/10"
                  onClick={() => setToRemove(s)}
                  aria-label={`Quitar a ${s.name} del equipo`}
                  title="Quitar del equipo"
                >
                  <UserMinus aria-hidden className="size-4" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Editar profesional">
        {editing && <StaffForm key={editing.id} staff={editing} onDone={() => setEditing(null)} />}
      </Dialog>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Sumar profesional">
        {adding && (
          <AddStaffForm
            onDone={(name) => {
              setAdding(false);
              setMsg({ ok: true, text: `${name} ya forma parte del equipo. Tocá "Editar perfil" para sumarle foto y certificados.` });
            }}
          />
        )}
      </Dialog>

      <Dialog open={toRemove !== null} onClose={() => setToRemove(null)} title="Quitar del equipo">
        {toRemove && (
          <RemoveStaff
            staff={toRemove}
            onCancel={() => setToRemove(null)}
            onDone={(text) => {
              setToRemove(null);
              setMsg({ ok: true, text });
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function StaffPhoto({ staff, size = "md" }: { staff: Pick<StaffRow, "name" | "photoUrl">; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/15 bg-ink/[0.04]",
        size === "lg" ? "size-24 shadow-[0_0_40px_-12px] shadow-ink/40" : "size-16",
      )}
    >
      {staff.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary
        <img src={cloudinaryThumb(staff.photoUrl, 240)} alt={`Foto de ${staff.name}`} className="size-full object-cover" />
      ) : (
        <UserRound aria-hidden strokeWidth={1.2} className={cn("text-muted", size === "lg" ? "size-10" : "size-7")} />
      )}
    </span>
  );
}

function AddStaffForm({ onDone }: { onDone: (name: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const name = String(formData.get("name") ?? "").trim();
    startTransition(async () => {
      const r = await createStaffAction(name);
      if (r.success) onDone(name);
      else setError(r.error);
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      <p className="text-sm text-ink-soft">Va a aparecer en la página y a recibir reservas con el horario general del local.</p>
      <Field label="Nombre" htmlFor="new-staff-name">
        <Input id="new-staff-name" name="name" required maxLength={40} autoFocus placeholder="Ej.: Juan Pérez" />
      </Field>
      <FormMessage msg={error ? { ok: false, text: error } : null} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Sumar al equipo
      </Button>
    </form>
  );
}

function RemoveStaff({ staff, onCancel, onDone }: { staff: StaffRow; onCancel: () => void; onDone: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const r = await removeStaffAction(staff.id);
      if (!r.success) return setError(r.error);
      const n = r.data?.upcoming ?? 0;
      onDone(
        n > 0
          ? `${staff.name} salió del equipo. Tiene ${n} ${n === 1 ? "turno agendado" : "turnos agendados"}: siguen en la agenda para que los reasignes o reprogrames.`
          : `${staff.name} salió del equipo.`,
      );
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p>
        <strong>{staff.name}</strong> va a dejar de verse en la página y no va a recibir nuevas reservas. Sus turnos ya agendados y el historial se conservan.
      </p>
      <FormMessage msg={error ? { ok: false, text: error } : null} />
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={pending}>
          Volver
        </Button>
        <Button className="flex-1 bg-st-cancelled hover:bg-st-cancelled/90" onClick={remove} disabled={pending}>
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Quitar
        </Button>
      </div>
    </div>
  );
}

function StaffForm({ staff, onDone }: { staff: StaffRow; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(staff.photoUrl);
  const [certificates, setCertificates] = useState<StaffCertificateRow[]>(staff.certificates);
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
      certificates,
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
        <StaffPhoto staff={{ name: staff.name, photoUrl }} />
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

      <CertificatesEditor value={certificates} onChange={setCertificates} />

      <FormMessage msg={error ? { ok: false, text: error } : null} />
      <Button type="submit" size="lg" disabled={pending || uploading}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar
      </Button>
    </form>
  );
}

/** Lista de certificados con "Agregar" (pide nombre y academia) y una ✕ para quitar cada uno. */
function CertificatesEditor({ value, onChange }: { value: StaffCertificateRow[]; onChange: (v: StaffCertificateRow[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    if (name.trim().length < 2) return setError("Ingresá el nombre del certificado");
    if (academy.trim().length < 2) return setError("Ingresá la academia");
    onChange([...value, { name: name.trim(), academy: academy.trim() }]);
    setName("");
    setAcademy("");
    setError(null);
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="label-wide text-ink-soft">Certificados</p>

      {value.length === 0 && !adding && <p className="text-sm text-muted">Todavía no cargaste certificados.</p>}

      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((c, i) => (
            <li key={`${c.name}-${i}`} className="flex items-center gap-3 rounded-sm border border-ink/10 bg-ink/[0.03] p-3">
              <BadgeCheck aria-hidden strokeWidth={1.5} className="size-5 shrink-0 text-ink" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="block truncate text-xs text-muted">{c.academy || "Academia sin especificar"}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, k) => k !== i))}
                aria-label={`Quitar certificado ${c.name}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-st-cancelled/10 hover:text-st-cancelled"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="flex flex-col gap-3 rounded-sm border border-dashed border-ink/25 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre del certificado" htmlFor="cert-name">
              <Input id="cert-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ej.: Colorimetría avanzada" autoFocus />
            </Field>
            <Field label="Academia" htmlFor="cert-academy">
              <Input id="cert-academy" value={academy} onChange={(e) => setAcademy(e.target.value)} maxLength={80} placeholder="Ej.: Academia Estilo" />
            </Field>
          </div>
          <FormMessage msg={error ? { ok: false, text: error } : null} />
          <div className="flex gap-2">
            <Button size="sm" onClick={add}>
              <Plus aria-hidden className="size-4" /> Agregar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        value.length < MAX_CERTIFICATES && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-sm border border-dashed border-ink/25 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <GraduationCap aria-hidden strokeWidth={1.5} className="size-4" /> Agregar certificado
          </button>
        )
      )}
    </div>
  );
}
